import { CATEGORIES } from './categories';
import { CategoryId, DocFields } from '../models/vault.models';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchers = CATEGORIES.filter((c) => c.id !== 'other').map((c) => ({
  id: c.id,
  kws: c.keywords.map((k) => ({ w: k.includes(' ') ? 2 : 1, re: new RegExp(`\\b${esc(k)}\\b`, 'i') })),
}));

/** Rule-based sorting: keyword hits in the OCR text (and file name, weighted higher). */
export function classify(text: string, filename = ''): { categoryId: CategoryId; confidence: number } {
  const name = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-.]+/g, ' ');
  let best: CategoryId = 'other';
  let bestScore = 0;
  for (const m of matchers) {
    let score = 0;
    for (const k of m.kws) {
      if (k.re.test(text)) score += k.w;
      if (k.re.test(name)) score += k.w * 2;
    }
    if (score > bestScore) { best = m.id; bestScore = score; }
  }
  return { categoryId: bestScore ? best : 'other', confidence: bestScore ? Math.min(0.95, bestScore / 6) : 0 };
}

function toIso(d: string, m: string, y: string): string | undefined {
  let yy = parseInt(y, 10);
  if (y.length === 2) yy += 2000;
  const mm = parseInt(m, 10), dd = parseInt(d, 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yy < 1990 || yy > 2100) return undefined;
  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/** Pulls an ID number and an expiry date out of the OCR text where the pattern is obvious. */
export function extractFields(text: string, categoryId: CategoryId): DocFields {
  const fields: DocFields = {};

  const exp = text.match(
    /(?:valid\s*(?:up\s*to|upto|till|until|thru)|expiry(?:\s*date)?|expires?(?:\s*on)?|date\s*of\s*expiry|validity)[^0-9\n]{0,15}(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})/i,
  );
  if (exp) fields.expiry = toIso(exp[1], exp[2], exp[3]);

  const pick = (re: RegExp) => text.match(re)?.[0]?.replace(/\s+/g, ' ');
  if (categoryId === 'identity') {
    fields.number =
      pick(/\b\d{4}\s\d{4}\s\d{4}\b/) ??               // Aadhaar
      pick(/\b[A-Z]{5}\d{4}[A-Z]\b/) ??                // PAN
      pick(/\b[A-Z]{2}\d{2}\s?\d{11}\b/) ??            // Driving licence
      pick(/\b[A-PR-WYa-pr-wy]\d{7}\b/);               // Passport
  } else if (categoryId === 'vehicle') {
    fields.number = pick(/\b[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4}\b/);
  } else if (categoryId === 'insurance') {
    fields.number = text.match(/policy\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9\/\-]{6,})/i)?.[1];
  }
  if (!fields.number) delete fields.number;
  if (!fields.expiry) delete fields.expiry;
  return fields;
}
