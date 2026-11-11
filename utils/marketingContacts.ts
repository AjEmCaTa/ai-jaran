// Marketing kontakti: čiste funkcije (bez baze), koriste ih i server i preglednik.
// Odvojeno od rezervacija; ovdje nema slanja mejlova.

export type LegalBasis = 'consent' | 'customer' | 'inquiry' | 'cold';
export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';

export const LEGAL_BASES: { id: LegalBasis; label: string; hint: string; sendable: boolean }[] = [
  { id: 'consent', label: 'Pristanak', hint: 'Kontakt je izričito pristao na mejlove (forma, lično, pismeno).', sendable: true },
  { id: 'customer', label: 'Korisnik POSLO ONE', hint: 'Firma već koristi POSLO ONE.', sendable: true },
  { id: 'inquiry', label: 'Poslao upit', hint: 'Sam se javio i tražio informacije.', sendable: true },
  { id: 'cold', label: 'Hladni kontakt', hint: 'Samo evidencija. Ovim kontaktima se ne šalju mejlovi.', sendable: false },
];

export const CONTACT_STATUSES: { id: ContactStatus; label: string }[] = [
  { id: 'active', label: 'Aktivan' },
  { id: 'unsubscribed', label: 'Odjavljen' },
  { id: 'bounced', label: 'Neispravna adresa' },
  { id: 'complained', label: 'Prijavio spam' },
];

export const MARKETING_CATEGORIES: { id: string; label: string; words: string[] }[] = [
  { id: 'restoran', label: 'Restoran', words: ['restoran', 'restaurant', 'pizzeria', 'picerija', 'konoba', 'ćevabdžinica', 'cevabdzinica', 'aščinica', 'ascinica'] },
  { id: 'kafic', label: 'Kafić / bar', words: ['kafić', 'kafic', 'caffe', 'cafe', 'kafana', 'bar', 'pub'] },
  { id: 'frizer', label: 'Frizerski salon', words: ['frizer', 'frizerski', 'hair', 'friseur'] },
  { id: 'barber', label: 'Barber shop', words: ['barber', 'brijačnica', 'brijacnica'] },
  { id: 'kozmeticki_salon', label: 'Kozmetički salon', words: ['kozmetički', 'kozmeticki', 'kozmetika', 'beauty', 'nokti', 'nails', 'manikir', 'spa', 'masaža', 'masaza'] },
  { id: 'apartmani', label: 'Apartmani', words: ['apartman', 'apartmani', 'apartments', 'smještaj', 'smjestaj', 'vikendica'] },
  { id: 'hotel', label: 'Hotel / motel', words: ['hotel', 'motel', 'hostel', 'pansion'] },
  { id: 'autoservis', label: 'Autoservis', words: ['autoservis', 'servis', 'vulkanizer', 'mehaničar', 'mehanicar', 'auto servis'] },
  { id: 'autopraonica', label: 'Autopraonica / detailing', words: ['praonica', 'autopraonica', 'detailing', 'dubinsko'] },
  { id: 'zdravlje', label: 'Zdravlje (stomatolog, fizio...)', words: ['stomatolog', 'zubar', 'ordinacija', 'fizio', 'fizioterapija', 'klinika', 'poliklinika', 'veterinar'] },
  { id: 'fitness', label: 'Teretana / fitness', words: ['teretana', 'fitness', 'gym', 'pilates', 'yoga', 'joga'] },
  { id: 'ostalo', label: 'Ostalo', words: [] },
];

export const categoryLabel = (id: string | null | undefined) =>
  MARKETING_CATEGORIES.find((c) => c.id === id)?.label || (id ? id : '');

// Slobodan tekst iz CSV-a -> naša kategorija (ili null).
export function normalizeCategory(raw: string | null | undefined): string | null {
  const v = (raw || '').trim().toLowerCase();
  if (!v) return null;
  const exact = MARKETING_CATEGORIES.find((c) => c.id === v || c.label.toLowerCase() === v);
  if (exact) return exact.id;
  for (const c of MARKETING_CATEGORIES) if (c.words.some((w) => v.includes(w))) return c.id;
  return 'ostalo';
}

export function normalizeEmail(raw: string | null | undefined): string {
  return (raw || '').trim().replace(/^mailto:/i, '').replace(/^<|>$/g, '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (email.length < 6 || email.length > 254) return false;
  if (!/^[^@\s,;<>"]+@[^@\s,;<>"]+\.[a-z]{2,}$/i.test(email)) return false;
  const [local, domain] = email.split('@');
  return local.length <= 64 && !domain.startsWith('.') && !domain.includes('..') && !local.startsWith('.') && !local.endsWith('.');
}

const clean = (v: unknown, max: number) => {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
  return s ? s.slice(0, max) : null;
};

// ---------- CSV ----------

// Prepozna separator (; , ili tab) po prvom redu, bez obzira na navodnike.
export function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/).find((l) => l.trim()) || '';
  const counts: [string, number][] = [';', ',', '\t'].map((d) => [d, first.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

// RFC 4180 CSV: navodnici, "" unutar polja, novi redovi unutar navodnika, BOM.
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export type ContactField = 'email' | 'company_name' | 'owner_name' | 'category' | 'city' | 'phone' | 'website' | 'notes' | 'tags';

export const CONTACT_FIELDS: { id: ContactField; label: string; aliases: string[] }[] = [
  { id: 'email', label: 'Email', aliases: ['email', 'e-mail', 'mail', 'email adresa', 'e-mail adresa', 'adresa e-pošte', 'e-pošta', 'eposta'] },
  { id: 'company_name', label: 'Naziv firme', aliases: ['naziv firme', 'firma', 'naziv', 'kompanija', 'company', 'business', 'biznis', 'ime firme', 'naziv biznisa', 'objekat'] },
  { id: 'owner_name', label: 'Ime vlasnika', aliases: ['ime vlasnika', 'vlasnik', 'ime i prezime', 'kontakt osoba', 'osoba', 'owner', 'name', 'ime'] },
  { id: 'category', label: 'Djelatnost', aliases: ['djelatnost', 'kategorija', 'category', 'vrsta', 'tip', 'industry', 'branša', 'bransa'] },
  { id: 'city', label: 'Grad', aliases: ['grad', 'city', 'mjesto', 'lokacija', 'opština', 'opstina', 'općina', 'opcina'] },
  { id: 'phone', label: 'Telefon', aliases: ['telefon', 'phone', 'tel', 'mobitel', 'mob', 'broj telefona', 'kontakt telefon'] },
  { id: 'website', label: 'Web stranica', aliases: ['web', 'website', 'sajt', 'web stranica', 'stranica', 'url', 'instagram', 'facebook'] },
  { id: 'notes', label: 'Napomena', aliases: ['napomena', 'napomene', 'notes', 'note', 'opis', 'komentar'] },
  { id: 'tags', label: 'Oznake', aliases: ['oznake', 'tagovi', 'tags', 'tag', 'oznaka'] },
];

const headerKey = (h: string) => h.trim().toLowerCase().replace(/[_*:]+/g, ' ').replace(/\s+/g, ' ');

// Zaglavlje CSV-a -> indeks kolone za svako polje (-1 = nema).
export function guessMapping(header: string[]): Record<ContactField, number> {
  const keys = header.map(headerKey);
  const out = {} as Record<ContactField, number>;
  const used = new Set<number>();
  for (const f of CONTACT_FIELDS) {
    let idx = keys.findIndex((k, i) => !used.has(i) && f.aliases.includes(k));
    if (idx < 0) idx = keys.findIndex((k, i) => !used.has(i) && f.aliases.some((a) => a.length > 3 && k.includes(a)));
    out[f.id] = idx;
    if (idx >= 0) used.add(idx);
  }
  return out;
}

export type ContactInput = {
  email: string;
  company_name: string | null;
  owner_name: string | null;
  category: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  tags: string[];
};

export function parseTags(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,;|]/) : [];
  const out: string[] = [];
  for (const t of list) {
    const v = typeof t === 'string' ? t.trim().toLowerCase().slice(0, 30) : '';
    if (v && !out.includes(v)) out.push(v);
    if (out.length >= 10) break;
  }
  return out;
}

// Jedan kontakt iz forme ili CSV reda -> očišćen unos ili razlog greške.
export function sanitizeContact(raw: Record<string, unknown>): { ok: true; contact: ContactInput } | { ok: false; reason: string } {
  const email = normalizeEmail(typeof raw.email === 'string' ? raw.email : '');
  if (!email) return { ok: false, reason: 'Nema email adrese' };
  if (!isValidEmail(email)) return { ok: false, reason: 'Neispravan email' };
  let website = clean(raw.website, 200);
  if (website && !/^https?:\/\//i.test(website) && /\.[a-z]{2,}/i.test(website)) website = `https://${website}`;
  return {
    ok: true,
    contact: {
      email,
      company_name: clean(raw.company_name, 160),
      owner_name: clean(raw.owner_name, 120),
      category: normalizeCategory(typeof raw.category === 'string' ? raw.category : null),
      city: clean(raw.city, 80),
      phone: clean(raw.phone, 40),
      website,
      notes: clean(raw.notes, 1000),
      tags: parseTags(raw.tags),
    },
  };
}

export type ImportRowResult = { line: number; email: string; reason: string };

// CSV redovi (bez zaglavlja) + mapiranje -> ispravni, neispravni i duplikati unutar fajla.
export function prepareImport(rows: string[][], mapping: Record<ContactField, number>, firstLine = 2) {
  const valid: ContactInput[] = [];
  const invalid: ImportRowResult[] = [];
  const duplicates: ImportRowResult[] = [];
  const seen = new Set<string>();
  rows.forEach((cells, i) => {
    const raw: Record<string, unknown> = {};
    for (const f of CONTACT_FIELDS) raw[f.id] = mapping[f.id] >= 0 ? cells[mapping[f.id]] ?? '' : '';
    const res = sanitizeContact(raw);
    const line = firstLine + i;
    if (!res.ok) {
      invalid.push({ line, email: String(raw.email || '').trim(), reason: res.reason });
      return;
    }
    if (seen.has(res.contact.email)) {
      duplicates.push({ line, email: res.contact.email, reason: 'Ponavlja se u fajlu' });
      return;
    }
    seen.add(res.contact.email);
    valid.push(res.contact);
  });
  return { valid, invalid, duplicates };
}

export const MAX_IMPORT_ROWS = 5000;

export function isLegalBasis(v: unknown): v is LegalBasis {
  return v === 'consent' || v === 'customer' || v === 'inquiry' || v === 'cold';
}
export function isContactStatus(v: unknown): v is ContactStatus {
  return v === 'active' || v === 'unsubscribed' || v === 'bounced' || v === 'complained';
}

// Isto pravilo kao funkcija marketing_contact_sendable u bazi.
export const isSendable = (c: { status: string; legal_basis: string }) =>
  c.status === 'active' && (c.legal_basis === 'consent' || c.legal_basis === 'customer' || c.legal_basis === 'inquiry');

// Za evidenciju: email se ne upisuje u cijelosti (npr. nakon brisanja kontakta).
export function maskEmail(email: string): string {
  const [l, d] = email.split('@');
  if (!d) return '***';
  return `${l.slice(0, 2)}***@${d}`;
}
