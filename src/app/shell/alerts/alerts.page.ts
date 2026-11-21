import { Component } from '@angular/core';
import { map } from 'rxjs';
import { DocumentsService } from '../../services/documents.service';
import { expiryInfo } from '../../models/vault.models';

@Component({
  selector: 'app-alerts',
  templateUrl: 'alerts.page.html',
  styleUrls: ['alerts.page.scss'],
  standalone: false,
})
export class AlertsPage {
  vm$ = this.docs.docs$.pipe(
    map((docs) => {
      const withExp = docs.filter((d) => expiryInfo(d));
      return {
        expired: withExp.filter((d) => expiryInfo(d)!.state === 'expired'),
        soon: withExp.filter((d) => expiryInfo(d)!.state === 'soon').sort((a, b) => expiryInfo(a)!.days - expiryInfo(b)!.days),
        ok: withExp.filter((d) => expiryInfo(d)!.state === 'ok').length,
        noDate: docs.length - withExp.length,
        total: docs.length,
      };
    }),
  );
  constructor(private docs: DocumentsService) {}
}
