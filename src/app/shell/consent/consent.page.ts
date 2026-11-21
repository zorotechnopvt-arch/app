import { Component, ViewChild, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/lazy';
import { RecordsService } from '../../services/records.service';
import { Consent, ConsentDuration, DURATION_MS } from '../../models/records.models';

@Component({
  selector: 'app-consent',
  templateUrl: 'consent.page.html',
  styleUrls: ['consent.page.scss'],
  standalone: false,
})
export class ConsentPage {
  readonly req = this.svc.currentRequest;
  readonly records = this.svc.records;
  readonly history = this.svc.consents;
  readonly durations: { id: ConsentDuration; label: string }[] = [
    { id: '24h', label: '24 hours' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' },
  ];

  @ViewChild(IonContent) content?: IonContent;

  state = signal<'review' | 'done' | 'denied'>('review');
  selected = signal<ReadonlySet<string>>(new Set());
  duration = signal<ConsentDuration>('7d');
  last = signal<Consent | null>(null);

  historyOpen = signal(false);
  readonly burst = Array.from({ length: 12 }, (_, i) => i * 30);

  count = computed(() => this.selected().size);
  durIndex = computed(() => this.durations.findIndex((d) => d.id === this.duration()));
  durLabel = computed(() => this.durations[this.durIndex()].label);
  allSelected = computed(() => this.count() === this.records.length);
  expires = computed(() => new Date(Date.now() + DURATION_MS[this.duration()]));
  lastActive = computed(() => { const c = this.last(); return !!c && this.svc.statusOf(c) === 'Active'; });

  constructor(public svc: RecordsService, private router: Router) {
    this.svc.load();
  }

  toggleHistory() { this.historyOpen.update((v) => !v); }

  isSelected(id: string) { return this.selected().has(id); }

  toggle(id: string) {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  toggleAll() {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.records.map((r) => r.id)));
  }

  approve() {
    const r = this.req();
    if (!r || !this.count()) return;
    this.last.set(this.svc.approve(r, [...this.selected()], this.duration()));
    this.state.set('done');
    void this.content?.scrollToTop(0);
  }

  deny() {
    const r = this.req();
    if (!r) return;
    this.last.set(this.svc.deny(r));
    this.state.set('denied');
    void this.content?.scrollToTop(0);
  }

  revokeLast() {
    const c = this.last();
    if (!c) return;
    this.svc.revoke(c.id);
    this.last.set(this.svc.consents().find((x) => x.id === c.id) ?? null);
  }

  /** DEMO: simulate the hospital raising a fresh request. */
  raise() {
    this.svc.raise();
    this.reset();
  }

  /** Changed their mind after denying: put the request back. */
  undoDeny() {
    const c = this.last();
    if (c) this.svc.removeConsent(c.id);
    this.reset();
  }

  reset() {
    this.selected.set(new Set());
    this.last.set(null);
    this.state.set('review');
    void this.content?.scrollToTop(0);
  }

  done() { this.router.navigateByUrl('/app/vault', { replaceUrl: true }); }
}
