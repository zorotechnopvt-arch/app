import { Component, Input } from '@angular/core';
import { DocumentsService } from '../../services/documents.service';
import { VaultDoc, expiryInfo } from '../../models/vault.models';
import { getCategory } from '../../vault/categories';

@Component({
  selector: 'app-doc-row',
  templateUrl: 'doc-row.component.html',
  styleUrls: ['doc-row.component.scss'],
  standalone: false,
})
export class DocRowComponent {
  @Input({ required: true }) doc!: VaultDoc;
  constructor(public docs: DocumentsService) {}
  get cat() { return getCategory(this.doc.categoryId); }
  get isImage() { return this.doc.mime.startsWith('image/'); }
  get exp() { return expiryInfo(this.doc); }
}
