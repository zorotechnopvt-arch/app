import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { AddFlowService } from '../../services/add-flow.service';
import { DocumentsService } from '../../services/documents.service';
import { CATEGORIES, getCategory } from '../../vault/categories';

@Component({
  selector: 'app-documents',
  templateUrl: 'documents.page.html',
  styleUrls: ['documents.page.scss'],
  standalone: false,
})
export class DocumentsPage {
  categories = CATEGORIES;
  query = '';
  filter = 'all';
  private q$ = new BehaviorSubject('');
  private f$ = new BehaviorSubject('all');

  list$ = combineLatest([this.docs.docs$, this.q$, this.f$]).pipe(
    map(([docs, q, f]) => {
      const term = q.trim().toLowerCase();
      return docs.filter((d) => {
        if (f === 'review' && d.reviewed) return false;
        if (f !== 'all' && f !== 'review' && d.categoryId !== f) return false;
        if (!term) return true;
        return [d.title, getCategory(d.categoryId).label, d.fields.number ?? '', d.text].some((s) => s.toLowerCase().includes(term));
      });
    }),
  );

  constructor(private docs: DocumentsService, route: ActivatedRoute, private addFlow: AddFlowService) {
    route.queryParamMap.subscribe((p) => { const f = p.get('filter'); if (f) this.setFilter(f); });
  }

  onQuery(v: string) { this.query = v; this.q$.next(v); }
  setFilter(f: string) { this.filter = f; this.f$.next(f); }
  add() { this.addFlow.start(); }
}
