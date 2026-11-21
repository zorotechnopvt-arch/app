import { Component, OnDestroy, computed, signal } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/lazy';
import { DEMO_OTP, RecordsService } from '../../services/records.service';
import { LinkedRecord } from '../../models/records.models';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';

type Step = 'phone' | 'otp' | 'searching' | 'results';
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

@Component({
  selector: 'app-find',
  templateUrl: 'find.page.html',
  styleUrls: ['find.page.scss'],
  standalone: false,
})
export class FindPage implements OnDestroy {
  readonly demoOtp = DEMO_OTP;
  readonly pending = this.svc.pending;
  readonly attention = this.svc.attention;
  readonly currentReq = this.svc.currentRequest;
  readonly stages = ['Verifying your number', 'Connecting to the health records network', 'Matching your records'];

  step = signal<Step>('phone');
  phone = signal('');
  otp = signal('');
  otpError = signal(false);
  verifying = signal(false);
  progress = signal(0);
  resendIn = signal(0);
  results = signal<LinkedRecord[]>([]);
  downloading = signal<string | null>(null);

  validPhone = computed(() => /^[6-9]\d{9}$/.test(this.phone()));
  display = computed(() => { const p = this.phone(); return p.length > 5 ? `${p.slice(0, 5)} ${p.slice(5)}` : p; });
  full = computed(() => `+91 ${this.display()}`);
  boxes = [0, 1, 2, 3, 4, 5];

  private timer?: ReturnType<typeof setInterval>;

  constructor(private svc: RecordsService, private modals: ModalController, private toast: ToastController) {}

  onPhone(ev: Event) {
    const el = ev.target as HTMLInputElement;
    this.phone.set(el.value.replace(/\D/g, '').slice(0, 10));
    el.value = this.display();
  }

  sendCode() {
    if (!this.validPhone()) return;
    this.otp.set('');
    this.step.set('otp');
    this.startResend();
    setTimeout(() => (document.querySelector('.otp-input') as HTMLInputElement | null)?.focus(), 150);
  }

  private startResend() {
    clearInterval(this.timer);
    this.resendIn.set(30);
    this.timer = setInterval(() => {
      this.resendIn.update((n) => Math.max(0, n - 1));
      if (this.resendIn() === 0) clearInterval(this.timer);
    }, 1000);
  }

  resend() {
    if (this.resendIn() > 0) return;
    this.startResend();
    this.toastMsg('A new code has been sent', 'success');
  }

  onOtp(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 6);
    el.value = digits;
    this.otp.set(digits);
    this.otpError.set(false);
    if (digits.length === 6) void this.verify(el);
  }

  private async verify(el: HTMLInputElement) {
    this.verifying.set(true);
    const ok = await this.svc.verifyOtp(this.otp());
    this.verifying.set(false);
    if (ok) {
      clearInterval(this.timer);
      await this.search();
    } else {
      this.otpError.set(true);
      this.otp.set('');
      el.value = '';
      setTimeout(() => this.otpError.set(false), 700);
    }
  }

  private async search() {
    this.step.set('searching');
    this.progress.set(0);
    for (let i = 1; i <= this.stages.length; i++) {
      await wait(750);
      this.progress.set(i);
    }
    this.results.set(await this.svc.lookup(this.phone()));
    await wait(350);
    this.step.set('results');
  }

  changeNumber() {
    clearInterval(this.timer);
    this.otp.set('');
    this.step.set('phone');
  }

  restart() {
    this.phone.set('');
    this.results.set([]);
    this.changeNumber();
  }

  async view(r: LinkedRecord) {
    const m = await this.modals.create({
      component: PdfViewerComponent, componentProps: { record: r }, cssClass: 'pdf-modal',
    });
    await m.present();
  }

  async download(r: LinkedRecord) {
    if (this.downloading()) return;
    this.downloading.set(r.id);
    try {
      await this.svc.download(r);
      await this.toastMsg(`${r.title} downloaded`, 'success');
    } catch {
      await this.toastMsg('Could not download the report', 'danger');
    } finally {
      this.downloading.set(null);
    }
  }

  private async toastMsg(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2200, position: 'top', color });
    await t.present();
  }

  ngOnDestroy() { clearInterval(this.timer); }
}
