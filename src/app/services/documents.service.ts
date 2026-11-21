import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { ClassifierService } from './classifier.service';
import { VaultDoc, expiryInfo } from '../models/vault.models';
import { getCategory } from '../vault/categories';

/**
 * Document storage. For now everything lives on this device (IndexedDB, one database per user).
 * When the backend exists, swap the `req(...)` calls for HTTP calls – the public API stays the same.
 */
@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private subject = new BehaviorSubject<VaultDoc[]>([]);
  readonly docs$ = this.subject.asObservable();

  private dbp?: Promise<IDBDatabase>;
  private uid = '';
  private loaded?: Promise<void>;
  private urls = new Map<string, string>();
  /** False until the first read from storage finishes (avoids flashing empty states). */
  isLoaded = false;

  constructor(private auth: AuthService, private classifier: ClassifierService) {}

  get snapshot(): VaultDoc[] { return this.subject.value; }

  private open(): Promise<IDBDatabase> {
    const uid = this.auth.getUser()?.id ?? 'guest';
    if (!this.dbp || uid !== this.uid) {
      this.uid = uid;
      this.loaded = undefined;
      this.isLoaded = false;
      this.subject.next([]);
      this.urls.forEach((u) => URL.revokeObjectURL(u));
      this.urls.clear();
      this.dbp = new Promise((res, rej) => {
        const r = indexedDB.open(`zoro-vault-${uid}`, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' });
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return this.dbp;
  }

  private async req<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open();
    return new Promise<T>((res, rej) => {
      const tx = db.transaction('docs', mode);
      const r = fn(tx.objectStore('docs'));
      tx.oncomplete = () => res(r.result);
      tx.onerror = tx.onabort = () => rej(tx.error);
    });
  }

  /** Call from any page before reading – safe to call many times. */
  ensureLoaded(): Promise<void> {
    void this.open();
    this.loaded ??= this.reload();
    return this.loaded;
  }

  private async reload() {
    const all = await this.req<VaultDoc[]>('readonly', (s) => s.getAll());
    this.isLoaded = true;
    this.subject.next(all.sort((a, b) => b.createdAt - a.createdAt));
  }

  /** Forget in-memory data (e.g. on sign-out). */
  clearMemory() {
    this.subject.next([]);
    this.loaded = undefined;
    this.isLoaded = false;
    this.dbp = undefined;
  }

  find(id: string): VaultDoc | undefined { return this.snapshot.find((d) => d.id === id); }

  async add(file: File, onStatus?: (msg: string) => void): Promise<VaultDoc> {
    await this.ensureLoaded();
    let text = '';
    if (file.type.startsWith('image/')) {
      onStatus?.('Reading your document…');
      text = await this.classifier.ocr(file);
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      onStatus?.('Reading your PDF…');
      text = await this.classifier.pdfText(file);
    }
    onStatus?.('Finding the right place…');
    const { categoryId, confidence } = this.classifier.classify(text, file.name);
    const doc: VaultDoc = {
      id: this.newId(),
      title: this.titleFrom(file.name, categoryId),
      categoryId,
      confidence,
      reviewed: false,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: Date.now(),
      fields: this.classifier.extractFields(text, categoryId),
      text,
      blob: file,
    };
    await this.req('readwrite', (s) => s.put(doc));
    await this.reload();
    return doc;
  }

  async update(id: string, patch: Partial<Omit<VaultDoc, 'id' | 'blob'>>): Promise<void> {
    const cur = this.find(id);
    if (!cur) return;
    await this.req('readwrite', (s) => s.put({ ...cur, ...patch }));
    await this.reload();
  }

  async remove(id: string): Promise<void> {
    await this.req('readwrite', (s) => s.delete(id));
    const u = this.urls.get(id);
    if (u) { URL.revokeObjectURL(u); this.urls.delete(id); }
    await this.reload();
  }

  previewUrl(doc: VaultDoc): string {
    let u = this.urls.get(doc.id);
    if (!u) { u = URL.createObjectURL(doc.blob); this.urls.set(doc.id, u); }
    return u;
  }

  /** Documents that are expired or expiring soon, most urgent first. */
  attention(docs: VaultDoc[]): VaultDoc[] {
    return docs
      .filter((d) => { const e = expiryInfo(d); return e && e.state !== 'ok'; })
      .sort((a, b) => expiryInfo(a)!.days - expiryInfo(b)!.days);
  }

  private newId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private titleFrom(filename: string, categoryId: string): string {
    const base = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').trim();
    const generic = !base || /^(img|image|photo|scan|screenshot|dsc|pxl|document|file)\b[\s\d]*$/i.test(base);
    if (!generic) return base.charAt(0).toUpperCase() + base.slice(1);
    const when = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `${categoryId === 'other' ? 'Document' : getCategory(categoryId).label} · ${when}`;
  }
}
