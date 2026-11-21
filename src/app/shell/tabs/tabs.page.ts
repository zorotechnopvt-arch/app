import { Component } from '@angular/core';
import { map } from 'rxjs';
import { AddFlowService } from '../../services/add-flow.service';
import { DocumentsService } from '../../services/documents.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  alerts$ = this.docs.docs$.pipe(map((d) => this.docs.attention(d).length));

  constructor(private docs: DocumentsService, private addFlow: AddFlowService) {
    this.docs.ensureLoaded();
  }

  add() { this.addFlow.start(); }
}
