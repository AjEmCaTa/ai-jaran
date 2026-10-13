// Čista logika toka rezervacije (bez vanjskih importa, testabilna s `node --test`).
// Statusi se čuvaju kao tekst u postojećoj koloni reservations.status; ovdje se samo
// normalizuju i provjeravaju prijelazi. Prihod se i dalje računa isključivo iz 'Završeno'.

export type StatusKind = 'pending' | 'confirmed' | 'rescheduling' | 'completed' | 'cancelled';
export type ReservationAction = 'confirm' | 'reschedule' | 'cancel' | 'complete';

export const STATUS_LABEL = {
  confirmed: 'Potvrđeno',
  rescheduling: 'Dogovor termina',
  completed: 'Završeno',
  cancelled: 'Otkazano',
} as const;

const norm = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Nepoznat/prazan status (npr. stari zapisi, 'Aktivno', 'Na čekanju') tretira se kao zahtjev.
export function statusKind(status: unknown): StatusKind {
  const key = norm(status);
  if (['otkazano', 'cancelled', 'canceled'].includes(key)) return 'cancelled';
  if (['zavrseno', 'completed', 'finished'].includes(key)) return 'completed';
  if (['potvrdjeno', 'confirmed'].includes(key)) return 'confirmed';
  if (['dogovor termina', 'rescheduling'].includes(key)) return 'rescheduling';
  return 'pending';
}

const ALLOWED: Record<StatusKind, ReservationAction[]> = {
  pending: ['confirm', 'reschedule', 'cancel', 'complete'],
  confirmed: ['reschedule', 'cancel', 'complete'],
  rescheduling: ['confirm', 'reschedule', 'cancel', 'complete'],
  completed: [],
  cancelled: [],
};

export function allowedActions(status: unknown): ReservationAction[] {
  return ALLOWED[statusKind(status)];
}

export function canApply(status: unknown, action: ReservationAction) {
  return allowedActions(status).includes(action);
}

export const TARGET_STATUS: Record<ReservationAction, string> = {
  confirm: STATUS_LABEL.confirmed,
  reschedule: STATUS_LABEL.rescheduling,
  cancel: STATUS_LABEL.cancelled,
  complete: STATUS_LABEL.completed,
};

// Kompatibilnost sa starim klijentom koji šalje { status }.
export function actionFromLegacyStatus(status: unknown): ReservationAction | null {
  const kind = statusKind(status);
  if (kind === 'confirmed') return 'confirm';
  if (kind === 'completed') return 'complete';
  if (kind === 'cancelled') return 'cancel';
  if (kind === 'rescheduling') return 'reschedule';
  return null;
}

export function parseAction(value: unknown): ReservationAction | null {
  return value === 'confirm' || value === 'reschedule' || value === 'cancel' || value === 'complete' ? value : null;
}

export function startMs(date: unknown): number | null {
  if (typeof date !== 'string' || !date) return null;
  const ms = new Date(date).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function durationOf(minutes: unknown) {
  const n = Number(minutes);
  return Number.isFinite(n) && n >= 30 && n <= 720 ? n : 120;
}

export type Slot = { id?: string; reservation_date: unknown; duration_minutes?: unknown; status?: unknown };

// Preklapanje s drugim rezervacijama iste firme. Otkazane se ne računaju (kao i na javnoj stranici).
export function findConflict(candidate: { id?: string; start: number; durationMinutes: number }, others: Slot[]) {
  const end = candidate.start + candidate.durationMinutes * 60000;
  for (const other of others) {
    if (candidate.id && other.id === candidate.id) continue;
    if (statusKind(other.status) === 'cancelled') continue;
    const s = startMs(other.reservation_date);
    if (s === null) continue;
    const e = s + durationOf(other.duration_minutes) * 60000;
    if (candidate.start < e && s < end) return other;
  }
  return null;
}

export type PushKind = 'new-reservation' | 'cancelled-reservation';

// Obavijest ne sadrži ime ni telefon klijenta (vidljivo na zaključanom ekranu).
export function buildReservationPayload(input: { reservationId: string; kind: PushKind; service?: string; when?: string }) {
  const clean = (v?: string, max = 80) => (v || '').replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max);
  const service = clean(input.service);
  const when = clean(input.when, 40);
  const detail = [service, when].filter(Boolean).join(' · ');
  const isNew = input.kind === 'new-reservation';
  return {
    title: isNew ? 'Novi zahtjev za rezervaciju' : 'Klijent je otkazao termin',
    body: detail || (isNew ? 'Stigao je novi zahtjev. Potvrdite ili dogovorite termin.' : 'Termin je otkazan.'),
    url: `/dashboard/reservations?id=${encodeURIComponent(input.reservationId)}`,
    tag: `reservation-${input.reservationId}-${input.kind}`,
  };
}
