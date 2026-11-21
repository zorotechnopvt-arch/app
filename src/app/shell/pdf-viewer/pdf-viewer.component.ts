import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, signal } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/lazy';
import { LinkedRecord } from '../../models/records.models';
import { RecordsService } from '../../services/records.service';

/** In-app viewer: renders every page of the PDF onto canvases (works the same in browser and in the app). */
@Component({
  selector: 'app-pdf-viewer',
  templateUrl: 'pdf-viewer.component.html',
  styleUrls: ['pdf-viewer.component.scss'],
  standalone: false,
})
export class PdfViewerComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) record!: LinkedRecord;
  @ViewChild('pages', { static: true }) pagesRef!: ElementRef<HTMLDivElement>;

  loading = signal(true);
  error = signal(false);
  pageCount = signal(0);
  private task?: { destroy(): Promise<void> };

  constructor(private modal: ModalController, private svc: RecordsService, private toast: ToastController) {}

  async ngAfterViewInit() {
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.mjs', document.baseURI).toString();
      const blob = await this.svc.fetchBlob(this.record);
      const task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
      this.task = task;
      const pdf = await task.promise;
      this.pageCount.set(pdf.numPages);

      const host = this.pagesRef.nativeElement;
      const width = host.clientWidth || 360;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * dpr });
        const canvas = document.createElement('canvas');
        canvas.className = 'page';
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        host.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport }).promise;
        if (i === 1) this.loading.set(false);
      }
    } catch (e) {
      console.error('PDF view failed', e);
      this.error.set(true);
      this.loading.set(false);
    }
  }

  async download() {
    try {
      await this.svc.download(this.record);
      const t = await this.toast.create({ message: 'Downloaded', duration: 1800, position: 'top', color: 'success' });
      await t.present();
    } catch {
      const t = await this.toast.create({ message: 'Could not download the report.', duration: 2500, position: 'top', color: 'danger' });
      await t.present();
    }
  }

  close() { this.modal.dismiss(); }

  ngOnDestroy() { void this.task?.destroy(); }
}
