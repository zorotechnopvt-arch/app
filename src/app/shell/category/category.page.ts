import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { AddFlowService } from '../../services/add-flow.service';
import { DocumentsService } from '../../services/documents.service';
import { getCategory } from '../../vault/categories';
import { expiryInfo } from '../../models/vault.models';

@Component({
  selector: 'app-category',
  templateUrl: 'category.page.html',
  styleUrls: ['category.page.scss'],
  standalone: false,
})
export class CategoryPage {
  vm$ = this.route.paramMap.pipe(
    map((p) => getCategory(p.get('id') ?? 'other')),
    switchMap((cat) => this.docs.docs$.pipe(map((all) => ({ cat, list: all.filter((d) => d.categoryId === cat.id) })))),
  );

  constructor(private route: ActivatedRoute, private docs: DocumentsService, private addFlow: AddFlowService) {
    this.docs.ensureLoaded();
  }
  exp = expiryInfo;
  add() { this.addFlow.start(); }
}
