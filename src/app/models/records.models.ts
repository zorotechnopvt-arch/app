/** A health record found for the user's phone number (from the records network). */
export interface LinkedRecord {
  id: string;
  title: string;
  type: string;
  facility: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  size: string;
  /** Path under the app's assets */
  file: string;
  fileName: string;
}

/** A hospital asking to see some of the user's records. */
export interface ConsentRequest {
  requestId: string;
  hospital: string;
  department: string;
  purpose: string;
  raisedAt: number;
}

export type ConsentStatus = 'active' | 'denied' | 'revoked';

export interface Consent {
  id: string;
  requestId: string;
  hospital: string;
  purpose: string;
  recordIds: string[];
  createdAt: number;
  expiresAt: number;
  status: ConsentStatus;
}

export type ConsentDuration = '24h' | '7d' | '30d';
export const DURATION_MS: Record<ConsentDuration, number> = {
  '24h': 24 * 3600e3,
  '7d': 7 * 24 * 3600e3,
  '30d': 30 * 24 * 3600e3,
};
