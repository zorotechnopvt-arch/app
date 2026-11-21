import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { DocumentsService } from '../../services/documents.service';
import { CATEGORIES, getCategory } from '../../vault/categories';
import { CategoryId, VaultDoc, confidenceLabel } from '../../models/vault.models';

@Component({
  selector: 'app-review',
  templateUrl: 'review.page.html',
  styleUrls: ['review.page.scss'],
  standalone: false,
})
export class ReviewPage {
  categories = CATEGORIES;
  doc?: VaultDoc;
  missing = false;
  title = '';
  categoryId: CategoryId = 'other';
  number = '';
  expiry = '';
  url = '';
  saving = false;

  constructor(
    private route: ActivatedRoute, private router: Router, public docs: DocumentsService,
    private alerts: AlertController, private toast: ToastController, private cdr: ChangeDetectorRef,
  ) {
    this.init();
  }

  private async init() {
    await this.docs.ensureLoaded();
    const doc = this.docs.find(this.route.snapshot.paramMap.get('id') ?? '');
    if (!doc) { this.missing = true; this.cdr.markForCheck(); return; }
    this.doc = doc;
    this.title = doc.title;
    this.categoryId = doc.categoryId;
    this.number = doc.fields.number ?? '';
    this.expiry = doc.fields.expiry ?? '';
    this.url = this.docs.previewUrl(doc);
    this.cdr.markForCheck(); // app runs without zone.js, so tell Angular the async state changed
  }

  get cat() { return getCategory(this.categoryId); }
  get isImage() { return !!this.doc?.mime.startsWith('image/'); }
  get detected() { return this.doc && this.doc.confidence > 0 ? getCategory(this.doc.categoryId) : null; }
  get conf() { return this.doc ? confidenceLabel(this.doc.confidence) : 'Unknown'; }

  async save() {
    if (!this.doc || this.saving) return;
    this.saving = true;
    const fields: { number?: string; expiry?: string } = {};
    if (this.number.trim()) fields.number = this.number.trim();
    if (this.expiry) fields.expiry = this.expiry;
    await this.docs.update(this.doc.id, { title: this.title.trim() || this.doc.title, categoryId: this.categoryId, fields, reviewed: true });
    const t = await this.toast.create({ message: `Saved to ${this.cat.label}`, duration: 2000, position: 'top', color: 'success' });
    await t.present();
    this.router.navigateByUrl(`/app/category/${this.categoryId}`, { replaceUrl: true });
  }

  async discard() {
    if (!this.doc) return;
    const id = this.doc.id;
    const a = await this.alerts.create({
      header: 'Discard this document?',
      message: 'It will not be saved.',
      buttons: [
        { text: 'Keep', role: 'cancel' },
        { text: 'Discard', role: 'destructive', handler: async () => { await this.docs.remove(id); this.router.navigateByUrl('/app/vault', { replaceUrl: true }); } },
      ],
    });
    await a.present();
  }

  later() { this.router.navigateByUrl('/app/vault', { replaceUrl: true }); }
}
