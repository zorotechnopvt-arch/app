import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ModalController, ToastController } from '@ionic/angular/lazy';
import { AddSheetComponent } from '../shell/add-sheet/add-sheet.component';
import { DocumentsService } from './documents.service';

/** Opens the "add document" sheet, processes the file and lands on the review screen. */
@Injectable({ providedIn: 'root' })
export class AddFlowService {
  constructor(
    private modals: ModalController,
    private loading: LoadingController,
    private toast: ToastController,
    private docs: DocumentsService,
    private router: Router,
  ) {}

  async start() {
    const modal = await this.modals.create({
      component: AddSheetComponent,
      breakpoints: [0, 0.6],
      initialBreakpoint: 0.6,
      handle: true,
      cssClass: 'add-sheet',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss<{ file?: File }>();
    if (data?.file) await this.process(data.file);
  }

  private async process(file: File) {
    const overlay = await this.loading.create({ message: 'Reading your document…', spinner: 'crescent', cssClass: 'zoro-loading' });
    await overlay.present();
    try {
      const doc = await this.docs.add(file, (m) => (overlay.message = m));
      await overlay.dismiss();
      await this.router.navigate(['/app/review', doc.id]);
    } catch (e) {
      console.error(e);
      await overlay.dismiss();
      const t = await this.toast.create({ message: 'Could not add that document.', duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    }
  }
}
