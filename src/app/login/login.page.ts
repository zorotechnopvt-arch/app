import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import { AuthService } from '../services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  showPassword = false;
  loading = false;
  googleLoading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(5)]],
    remember: [false],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, arrowForwardOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async signIn() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const { email, password } = this.form.getRawValue();
      const ok = await this.auth.signInWithPassword(email, password);
      if (ok) {
        await this.router.navigateByUrl('/app', { replaceUrl: true });
      } else {
        await this.showError('Incorrect email or password.');
      }
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async showError(message: string) {
    const t = await this.toast.create({ message, duration: 3000, color: 'danger', position: 'top' });
    await t.present();
  }

  async signInWithGoogle() {
    if (this.googleLoading) return;
    this.googleLoading = true;
    this.cdr.markForCheck();
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/app', { replaceUrl: true });
    } catch (err) {
      console.error('Google sign in failed', err);
      const t = await this.toast.create({
        message: 'Google sign-in failed. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await t.present();
    } finally {
      this.googleLoading = false;
      this.cdr.markForCheck();
    }
  }

  forgotPassword() {
    // TODO: navigate to forgot password screen
  }

  signUp() {
    // TODO: navigate to sign up screen
  }
}
