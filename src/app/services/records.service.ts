import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import {
  Consent, ConsentDuration, ConsentRequest, DURATION_MS, LinkedRecord,
} from '../models/records.models';

/** Demo OTP accepted by the mock verification. */
export const DEMO_OTP = '123456';

/** The two sample reports every successful lookup returns while there is no backend. */
const RECORDS: LinkedRecord[] = [
  {
    id: 'rec-cbc', title: 'Complete Blood Count (CBC)', type: 'Lab report', facility: 'Apollo Hospital',
    date: '2026-11-12', size: '6 KB', file: 'assets/records/cbc-report.pdf', fileName: 'Complete-Blood-Count-CBC.pdf',
  },
  {
    id: 'rec-lipid', title: 'Lipid Profile', type: 'Lab report', facility: 'Apollo Hospital',
    date: '2026-10-28', size: '5 KB', file: 'assets/records/lipid-profile.pdf', fileName: 'Lipid-Profile.pdf',
  },
];

const REQUEST_SEEDS = [
  { department: 'Cardiology OPD', purpose: 'Consultation & treatment' },
  { department: 'General Medicine', purpose: 'Follow-up consultation' },
  { department: 'Diabetology', purpose: 'Treatment planning' },
  { department: 'Orthopaedics', purpose: 'Second opinion' },
];

/** A new request from the hospital (the real one will come from the backend / a push notification). */
function makeRequest(): ConsentRequest {
  const seed = REQUEST_SEEDS[Math.floor(Math.random() * REQUEST_SEEDS.length)];
  return {
    requestId: `APL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    hospital: 'Apollo Hospital', department: seed.department, purpose: seed.purpose, raisedAt: Date.now(),
  };
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Records found by phone number, plus consent handling.
 * Everything here is mocked locally; swap the bodies for API calls when the backend is ready.
 */
@Injectable({ providedIn: 'root' })
export class RecordsService {
  readonly records = RECORDS;

  readonly consents = signal<Consent[]>([]);
  /** Every request a hospital has raised with this user. */
  readonly requests = signal<ConsentRequest[]>([]);
  /** Requests the user has not approved or denied yet, oldest first. */
  readonly pendingList = computed(() =>
    this.requests().filter((r) => !this.consents().some((c) => c.requestId === r.requestId)).sort((a, b) => a.raisedAt - b.raisedAt));
  readonly pending = computed(() => this.pendingList().length > 0);
  /** The request to show on the consent page. */
  readonly currentRequest = computed<ConsentRequest | null>(() => this.pendingList()[0] ?? null);
  /** Consents that are currently giving a hospital access. */
  readonly activeCount = computed(() => this.consents().filter((c) => c.status === 'active' && c.expiresAt > Date.now()).length);
  /** Something to look at on the consent screen: a waiting request or live access. */
  readonly attention = computed(() => this.pending() || this.activeCount() > 0);

  constructor(private auth: AuthService) {
    this.load();
  }

  // ---------- lookup by phone ----------

  /** Mock: checks the one-time code. Real version: POST the code to the backend. */
  async verifyOtp(code: string): Promise<boolean> {
    await delay(700);
    return code === DEMO_OTP;
  }

  /** Mock: any verified number returns the two sample reports. */
  async lookup(_phone: string): Promise<LinkedRecord[]> {
    await delay(500);
    return this.records;
  }

  // ---------- files ----------

  private url(r: LinkedRecord) { return new URL(r.file, document.baseURI).toString(); }

  async fetchBlob(r: LinkedRecord): Promise<Blob> {
    const res = await fetch(this.url(r));
    if (!res.ok) throw new Error('Could not load the report');
    return res.blob();
  }

  async download(r: LinkedRecord): Promise<void> {
    const blob = await this.fetchBlob(r);
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = r.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  }

  // ---------- consent ----------

  private key() { return `zoro_consents_${this.auth.getUser()?.id ?? 'guest'}`; }

  private reqKey() { return `zoro_requests_${this.auth.getUser()?.id ?? 'guest'}`; }

  load() {
    try { this.consents.set(JSON.parse(localStorage.getItem(this.key()) ?? '[]') as Consent[]); }
    catch { this.consents.set([]); }
    try {
      const raw = localStorage.getItem(this.reqKey());
      if (raw) { this.requests.set(JSON.parse(raw) as ConsentRequest[]); }
      else { this.saveRequests([makeRequest()]); } // first run: Apollo has already asked
    } catch { this.requests.set([]); }
  }

  private saveRequests(list: ConsentRequest[]) {
    try { localStorage.setItem(this.reqKey(), JSON.stringify(list)); } catch { /* ignore */ }
    this.requests.set(list);
  }

  /** DEMO: pretend the hospital just raised another request. */
  raise(): ConsentRequest {
    const r = makeRequest();
    this.saveRequests([...this.requests(), r]);
    return r;
  }

  private save(list: Consent[]) {
    try { localStorage.setItem(this.key(), JSON.stringify(list)); } catch { /* ignore */ }
    this.consents.set(list);
  }

  private newId() { return 'CON-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }

  approve(req: ConsentRequest, recordIds: string[], duration: ConsentDuration): Consent {
    const now = Date.now();
    const c: Consent = {
      id: this.newId(), requestId: req.requestId, hospital: req.hospital,
      purpose: req.purpose, recordIds, createdAt: now, expiresAt: now + DURATION_MS[duration], status: 'active',
    };
    this.save([c, ...this.consents()]);
    return c;
  }

  deny(req: ConsentRequest): Consent {
    const now = Date.now();
    const c: Consent = {
      id: this.newId(), requestId: req.requestId, hospital: req.hospital,
      purpose: req.purpose, recordIds: [], createdAt: now, expiresAt: now, status: 'denied',
    };
    this.save([c, ...this.consents()]);
    return c;
  }

  /** Undo a decision (e.g. "I changed my mind") so the request is waiting again. */
  removeConsent(id: string) { this.save(this.consents().filter((c) => c.id !== id)); }

  revoke(id: string) {
    this.save(this.consents().map((c) => (c.id === id ? { ...c, status: 'revoked' as const } : c)));
  }

  statusOf(c: Consent): 'Active' | 'Expired' | 'Revoked' | 'Denied' {
    if (c.status === 'denied') return 'Denied';
    if (c.status === 'revoked') return 'Revoked';
    return c.expiresAt > Date.now() ? 'Active' : 'Expired';
  }

  titleOf(id: string) { return this.records.find((r) => r.id === id)?.title ?? id; }
}
