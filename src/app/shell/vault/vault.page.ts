import { Component } from '@angular/core';
import { map } from 'rxjs';
import { AddFlowService } from '../../services/add-flow.service';
import { AuthService, GoogleUserInfo } from '../../services/auth.service';
import { DocumentsService } from '../../services/documents.service';
import { RecordsService } from '../../services/records.service';
import { CATEGORIES } from '../../vault/categories';
import { expiryInfo } from '../../models/vault.models';

@Component({
  selector: 'app-vault',
  templateUrl: 'vault.page.html',
  styleUrls: ['vault.page.scss'],
  standalone: false,
})
export class VaultPage {
  user: GoogleUserInfo | null = this.auth.getUser();
  first = this.user?.given_name || this.user?.name?.split(' ')[0] || 'there';
  greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();

  vm$ = this.docs.docs$.pipe(
    map((docs) => ({
      total: docs.length,
      categories: CATEGORIES.map((c) => ({ ...c, count: docs.filter((d) => d.categoryId === c.id).length })),
      recent: docs.slice(0, 4),
      attention: this.docs.attention(docs),
      ready: this.docs.isLoaded,
      pending: docs.filter((d) => !d.reviewed).length,
    })),
  );

  constructor(private auth: AuthService, private docs: DocumentsService, private addFlow: AddFlowService, public records: RecordsService) {
    this.records.load();
  }

  exp = expiryInfo;
  add() { this.addFlow.start(); }
}
