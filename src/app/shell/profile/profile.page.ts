import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService, GoogleUserInfo } from '../../services/auth.service';
import { DocumentsService } from '../../services/documents.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  user: GoogleUserInfo | null = this.auth.getUser();
  stats$ = this.docs.docs$.pipe(
    map((d) => ({
      count: d.length,
      cats: new Set(d.map((x) => x.categoryId)).size,
      mb: d.reduce((a, x) => a + x.size, 0) / 1048576,
    })),
  );

  constructor(private auth: AuthService, private docs: DocumentsService, private router: Router) {}

  signOut() {
    this.auth.signOut();
    this.docs.clearMemory();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
