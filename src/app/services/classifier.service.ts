import { Injectable } from '@angular/core';
import { classify, extractFields } from '../vault/classify';

/**
 * Reads text from a scan (OCR, on-device) and sorts it with simple keyword rules.
 * The `classify` step is the swap point for an AI classifier later.
 */
@Injectable({ providedIn: 'root' })
export class ClassifierService {
  classify = classify;
  extractFields = extractFields;

  /** OCR for images. Returns '' if it can't run (offline, unsupported file…). */
  async ocr(file: Blob): Promise<string> {
    try {
      const img = await this.downscale(file, 1800);
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      try {
        const { data } = await worker.recognize(img);
        return data.text ?? '';
      } finally {
        await worker.terminate();
      }
    } catch (e) {
      console.warn('OCR unavailable, falling back to file name only', e);
      return '';
    }
  }

  /**
   * Text of a PDF. Uses the PDF's own text layer (first 5 pages); if it has none (a scanned PDF),
   * renders the first page to an image and runs OCR on that.
   */
  async pdfText(file: Blob): Promise<string> {
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.mjs', document.baseURI).toString();
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await task.promise;
      try {
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
        }
        if (text.replace(/\s/g, '').length >= 40) return text;

        // Scanned PDF: no text layer, so read page 1 as an image.
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(3, 1800 / Math.max(base.width, base.height)) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        const img = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
        return img ? await this.ocr(img) : text;
      } finally {
        void task.destroy();
      }
    } catch (e) {
      console.warn('Could not read PDF, falling back to file name only', e);
      return '';
    }
  }

  private async downscale(file: Blob, max: number): Promise<Blob> {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale === 1) return file;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', 0.88));
    } catch {
      return file;
    }
  }
}
