export type CategoryId =
  | 'identity' | 'education' | 'health' | 'vehicle' | 'rental'
  | 'finance' | 'insurance' | 'work' | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  hint: string;
  icon: string;
  color: string;
  bg: string;
  keywords: string[];
}

export interface DocFields {
  number?: string;
  /** ISO date yyyy-mm-dd */
  expiry?: string;
}

export interface VaultDoc {
  id: string;
  title: string;
  categoryId: CategoryId;
  /** 0..1 – how sure the classifier is. 0 = couldn't tell. */
  confidence: number;
  reviewed: boolean;
  mime: string;
  size: number;
  createdAt: number;
  fields: DocFields;
  text: string;
  blob: Blob;
}

export interface ExpiryInfo {
  days: number;
  state: 'expired' | 'soon' | 'ok';
  label: string;
}

export const EXPIRY_SOON_DAYS = 60;

export function expiryInfo(doc: VaultDoc): ExpiryInfo | null {
  const e = doc.fields?.expiry;
  if (!e) return null;
  const end = new Date(e + 'T00:00:00').getTime();
  if (Number.isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return { days, state: 'expired', label: `Expired ${Math.abs(days)}d ago` };
  if (days <= EXPIRY_SOON_DAYS) return { days, state: 'soon', label: days === 0 ? 'Expires today' : `Expires in ${days}d` };
  return { days, state: 'ok', label: `Valid till ${new Date(end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` };
}

export function confidenceLabel(c: number): 'High' | 'Medium' | 'Low' | 'Unknown' {
  if (c >= 0.6) return 'High';
  if (c >= 0.3) return 'Medium';
  return c > 0 ? 'Low' : 'Unknown';
}
