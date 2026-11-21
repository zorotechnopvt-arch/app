import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';

@Component({
  selector: 'app-add-sheet',
  templateUrl: 'add-sheet.component.html',
  styleUrls: ['add-sheet.component.scss'],
  standalone: false,
})
export class AddSheetComponent {
  constructor(private modal: ModalController) {}

  pick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.modal.dismiss({ file });
  }

  close() { this.modal.dismiss(); }
}
