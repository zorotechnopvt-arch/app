import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs/tabs.page';
import { VaultPage } from './vault/vault.page';
import { DocumentsPage } from './documents/documents.page';
import { AlertsPage } from './alerts/alerts.page';
import { ProfilePage } from './profile/profile.page';
import { CategoryPage } from './category/category.page';
import { DocumentPage } from './document/document.page';
import { ReviewPage } from './review/review.page';
import { AddSheetComponent } from './add-sheet/add-sheet.component';
import { DocRowComponent } from './doc-row/doc-row.component';
import { FindPage } from './find/find.page';
import { ConsentPage } from './consent/consent.page';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: 'vault', component: VaultPage },
      { path: 'documents', component: DocumentsPage },
      { path: 'alerts', component: AlertsPage },
      { path: 'profile', component: ProfilePage },
      { path: '', redirectTo: 'vault', pathMatch: 'full' },
    ],
  },
  { path: 'category/:id', component: CategoryPage },
  { path: 'document/:id', component: DocumentPage },
  { path: 'review/:id', component: ReviewPage },
  { path: 'find', component: FindPage },
  { path: 'consent', component: ConsentPage },
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [
    TabsPage, VaultPage, DocumentsPage, AlertsPage, ProfilePage, CategoryPage, DocumentPage, ReviewPage,
    AddSheetComponent, DocRowComponent, FindPage, ConsentPage, PdfViewerComponent,
  ],
})
export class ShellModule {}
