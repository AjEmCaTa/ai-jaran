import type { SupabaseClient } from '@supabase/supabase-js';

// Poslovna pravila rezervacija (čista logika, bez vanjskih importa, testabilna s `node --test`).
//
// Vrijeme termina se čuva kao tekst bez vremenske zone (npr. '2026-10-28T10:00'), a unosi ga klijent
// po lokalnom (bosanskom) vremenu. Server radi u UTC-u, pa se termin MORA tumačiti u zoni Europe/Sarajevo,
// inače pravila "2 sata" i "24 sata" odstupaju za 1-2 sata.

export const BUSINESS_TZ = 'Europe/Sarajevo';

// Dogovorena pravila (docs/PRODUCTION_RELEASE_PLAN.md):
export const CANCEL_MIN_NOTICE_MIN = 120; // klijent može otkazati najkasnije 2 sata prije termina
export const REMINDER_BEFORE_MIN = 24 * 60; // podsjetnik 24 sata prije termina
// Zahtjev koji vlasnik ne obradi ističe nakon 24 sata od kreiranja, a najkasnije kad termin počne.
export const PENDING_TTL_MIN = 24 * 60;

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;
const HAS_ZONE_RE = /(Z|[+-]\d{2}:?\d{2})$/i;

// Pomak zone (ms) u trenutku `utcMs`.
function zoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// Termin kao UTC milisekunde. Tekst bez zone = zidno vrijeme u Europe/Sarajevo; tekst sa zonom se poštuje.
export function reservationStartMs(value: unknown, timeZone: string = BUSINESS_TZ): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  if (HAS_ZONE_RE.test(text)) {
    const ms = new Date(text).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const m = WALL_RE.exec(text);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const wallAsUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0));
  if (!Number.isFinite(wallAsUtc)) return null;
  // Dvije iteracije pokrivaju prelazak na ljetno/zimsko vrijeme.
  let guess = wallAsUtc - zoneOffsetMs(wallAsUtc, timeZone);
  guess = wallAsUtc - zoneOffsetMs(guess, timeZone);
  return guess;
}

export type CancelDecision = { ok: true } | { ok: false; code: 'invalid-date' | 'already-started' | 'too-late'; message: string };

// Klijent smije otkazati samo ako do početka ima najmanje CANCEL_MIN_NOTICE_MIN minuta.
export function customerCancelDecision(reservationDate: unknown, nowMs: number): CancelDecision {
  const start = reservationStartMs(reservationDate);
  if (start === null) {
    return { ok: false, code: 'invalid-date', message: 'Termin nema ispravan datum, pa ga nije moguće otkazati. Kontaktirajte firmu.' };
  }
  if (start <= nowMs) {
    return { ok: false, code: 'already-started', message: 'Termin je već počeo ili je prošao i ne može se otkazati.' };
  }
  if (start - nowMs < CANCEL_MIN_NOTICE_MIN * 60000) {
    return {
      ok: false,
      code: 'too-late',
      message: 'Termin se može otkazati najkasnije 2 sata prije početka. Za hitne promjene kontaktirajte firmu direktno.',
    };
  }
  return { ok: true };
}

export type LifecycleRow = {
  id: string;
  status?: unknown;
  reservation_date?: unknown;
  created_at?: unknown;
  reminder_sent_at?: unknown;
  customer_email?: unknown;
};

const kindOf = (status: unknown): 'pending' | 'confirmed' | 'other' => {
  const key = String(status ?? '')
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  if (['potvrdjeno', 'confirmed'].includes(key)) return 'confirmed';
  if (['otkazano', 'cancelled', 'canceled', 'zavrseno', 'completed', 'finished', 'isteklo', 'expired', 'dogovor termina', 'rescheduling'].includes(key)) return 'other';
  return 'pending'; // prazan/nepoznat status je zahtjev (isto kao u reservationFlow)
};

// Zahtjevi (čekaju vlasnika) koji su istekli: 24 h od kreiranja ili početak termina, šta god bude prije.
export function selectExpired(rows: LifecycleRow[], nowMs: number): LifecycleRow[] {
  return rows.filter((row) => {
    if (kindOf(row.status) !== 'pending') return false;
    const created = typeof row.created_at === 'string' ? new Date(row.created_at).getTime() : NaN;
    const start = reservationStartMs(row.reservation_date);
    const ttlEnd = Number.isFinite(created) ? created + PENDING_TTL_MIN * 60000 : Infinity;
    const deadline = Math.min(ttlEnd, start ?? Infinity);
    return Number.isFinite(deadline) && deadline <= nowMs;
  });
}

// Potvrđeni termini koji počinju u narednih 24 h, a podsjetnik još nije poslan (i imaju email klijenta).
export function selectReminders(rows: LifecycleRow[], nowMs: number): LifecycleRow[] {
  return rows.filter((row) => {
    if (kindOf(row.status) !== 'confirmed') return false;
    if (row.reminder_sent_at) return false;
    if (typeof row.customer_email !== 'string' || !row.customer_email.includes('@')) return false;
    const start = reservationStartMs(row.reservation_date);
    if (start === null) return false;
    const until = start - nowMs;
    return until > 0 && until <= REMINDER_BEFORE_MIN * 60000;
  });
}

// ---------- Životni ciklus (istek i podsjetnici) ----------
type Row = LifecycleRow & { business_id?: string | null; service_name?: string | null; customer_name?: string | null };

export type ReminderSender = (row: Row) => Promise<boolean>;

export type LifecycleSummary = { scanned: number; expired: number; reminded: number; reminderFailed: number };

const TERMINAL = ['otkazano', 'cancelled', 'canceled', 'zavrseno', 'completed', 'finished', 'isteklo', 'expired'];
const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Jedan prolaz: (1) zahtjevi koji su istekli dobijaju status 'Isteklo' (termin se oslobađa),
// (2) potvrđenim terminima u narednih 24 h šalje se podsjetnik tačno jednom.
// Sve izmjene su atomarne (uvjet na stari status / reminder_sent_at), pa istovremeni prolazi ne dupliraju posao.
export async function runReservationLifecycle(admin: SupabaseClient, nowMs: number, sendReminder: ReminderSender): Promise<LifecycleSummary> {
  const summary: LifecycleSummary = { scanned: 0, expired: 0, reminded: 0, reminderFailed: 0 };
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from('reservations')
      .select('id, business_id, status, reservation_date, created_at, reminder_sent_at, customer_email, customer_name, service_name')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < pageSize) break;
  }
  const active = rows.filter((r) => !TERMINAL.includes(norm(r.status)));
  summary.scanned = active.length;

  for (const row of selectExpired(active, nowMs)) {
    let q = admin.from('reservations').update({ status: 'Isteklo' }).eq('id', row.id);
    q = row.status === null || row.status === undefined ? q.is('status', null) : q.eq('status', row.status as string);
    const { data, error } = await q.select('id').maybeSingle();
    if (error) throw error;
    if (data) summary.expired += 1;
  }

  for (const row of selectReminders(active, nowMs)) {
    // Rezervacija se "zauzima" prije slanja: ko prvi upiše reminder_sent_at, taj šalje.
    const claimedAt = new Date(nowMs).toISOString();
    const { data: claimed, error: claimError } = await admin
      .from('reservations')
      .update({ reminder_sent_at: claimedAt })
      .eq('id', row.id)
      .is('reminder_sent_at', null)
      .select('id')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) continue;
    let sent = false;
    try {
      sent = await sendReminder(row);
    } catch (e) {
      console.error('Podsjetnik nije poslan:', e);
    }
    if (sent) {
      summary.reminded += 1;
    } else {
      summary.reminderFailed += 1;
      // Vrati oznaku da sljedeći prolaz pokuša ponovo.
      await admin.from('reservations').update({ reminder_sent_at: null }).eq('id', row.id);
    }
  }
  return summary;
}
