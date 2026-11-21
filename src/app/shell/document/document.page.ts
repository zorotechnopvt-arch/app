import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular/lazy';
import { combineLatest, map } from 'rxjs';
import { DocumentsService } from '../../services/documents.service';
import { CATEGORIES, getCategory } from '../../vault/categories';
import { VaultDoc, expiryInfo } from '../../models/vault.models';

@Component({
  selector: 'app-document',
  templateUrl: 'document.page.html',
  styleUrls: ['document.page.scss'],
  standalone: false,
})
export class DocumentPage {
  vm$ = combineLatest([this.route.paramMap, this.docs.docs$]).pipe(
    map(([p, all]) => {
      const doc = all.find((d) => d.id === p.get('id'));
      return doc ? { doc, cat: getCategory(doc.categoryId), exp: expiryInfo(doc), url: this.docs.previewUrl(doc), isImage: doc.mime.startsWith('image/') } : null;
    }),
  );
  ready = false;

  constructor(
    private route: ActivatedRoute, private router: Router, private docs: DocumentsService,
    private sheets: ActionSheetController, private alerts: AlertController, private toast: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    this.docs.ensureLoaded().then(() => { this.ready = true; this.cdr.markForCheck(); });
  }

  size(b: number) { return b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`; }

  async rename(doc: VaultDoc, ev: Event) {
    const title = (ev.target as HTMLInputElement).value.trim();
    if (title && title !== doc.title) await this.docs.update(doc.id, { title });
  }

  async changeCategory(doc: VaultDoc) {
    const sheet = await this.sheets.create({
      header: 'Move to category',
      buttons: [
        ...CATEGORIES.map((c) => ({ text: c.label, icon: c.icon, handler: () => { this.docs.update(doc.id, { categoryId: c.id, reviewed: true }); } })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async updateField(doc: VaultDoc, key: 'number' | 'expiry', ev: Event) {
    const v = (ev.target as HTMLInputElement).value.trim();
    const fields = { ...doc.fields };
    if (v) fields[key] = v; else delete fields[key];
    await this.docs.update(doc.id, { fields });
  }

  download(doc: VaultDoc) {
    const a = document.createElement('a');
    a.href = this.docs.previewUrl(doc);
    a.download = doc.title + (doc.mime === 'application/pdf' ? '.pdf' : doc.mime.startsWith('image/') ? '.' + (doc.mime.split('/')[1] || 'jpg') : '');
    a.click();
  }

  async share(doc: VaultDoc) {
    const file = new File([doc.blob], doc.title, { type: doc.mime });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: doc.title }); } catch { /* cancelled */ }
    } else {
      this.download(doc);
      const t = await this.toast.create({ message: 'Sharing isn’t available here – downloaded instead.', duration: 2500, position: 'top' });
      await t.present();
    }
  }

  openFile(doc: VaultDoc) { window.open(this.docs.previewUrl(doc), '_blank'); }

  async remove(doc: VaultDoc) {
    const a = await this.alerts.create({
      header: 'Delete document?',
      message: `“${doc.title}” will be removed permanently.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: async () => { await this.docs.remove(doc.id); this.router.navigateByUrl('/app/vault', { replaceUrl: true }); } },
      ],
    });
    await a.present();
  }
}
