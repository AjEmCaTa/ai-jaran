// Noćenja (check-in / check-out) za kategoriju "Vile i apartmani".
// Rezervacija se čuva kao i svaka druga: početak = datum dolaska u vrijeme prijave,
// trajanje = minute do odlaska u vrijeme odjave. Svaka usluga je jedna smještajna jedinica,
// pa se zauzetost računa po nazivu usluge (apartmana), a ne za cijelu firmu.
// Čista logika bez importa, testabilna s `node --test`.

export const STAY_CATEGORY = 'vile-apartmani';
export const STAY_MAX_NIGHTS = 60;
export const CHECK_OUT_TIME = '10:00';
export const DEFAULT_CHECK_IN_TIME = '14:00';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isStayCategory = (category: unknown) => String(category ?? '') === STAY_CATEGORY;

// Vrijeme prijave: radno vrijeme firme ako počinje od 11:00 nadalje (npr. 13:00), inače 14:00.
export function checkInTime(workStart: unknown) {
  const t = String(workStart ?? '').slice(0, 5);
  return /^\d{2}:\d{2}$/.test(t) && t >= '11:00' && t <= '22:00' ? t : DEFAULT_CHECK_IN_TIME;
}

const dayUtc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

export function addDays(date: string, n: number) {
  const ms = dayUtc(date) + n * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) return 0;
  return Math.round((dayUtc(checkOut) - dayUtc(checkIn)) / 86400000);
}

// Noći koje boravak zauzima: od dana dolaska do dana prije odlaska.
export function nightsOf(checkIn: string, checkOut: string) {
  const n = nightsBetween(checkIn, checkOut);
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(checkIn, i));
}

export type StayPlan = { reservationDate: string; durationMinutes: number; nights: number };

export function planStay(checkIn: unknown, checkOut: unknown, workStart: unknown): StayPlan | { error: string } {
  if (typeof checkIn !== 'string' || typeof checkOut !== 'string' || !DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
    return { error: 'Odaberite datum dolaska i odlaska.' };
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return { error: 'Odlazak mora biti bar jedan dan nakon dolaska.' };
  if (nights > STAY_MAX_NIGHTS) return { error: `Najduži boravak je ${STAY_MAX_NIGHTS} noći.` };
  const inTime = checkInTime(workStart);
  const [ih, im] = inTime.split(':').map(Number);
  const [oh, om] = CHECK_OUT_TIME.split(':').map(Number);
  const durationMinutes = nights * 1440 - (ih * 60 + im) + (oh * 60 + om);
  return { reservationDate: `${checkIn}T${inTime}:00`, durationMinutes, nights };
}

export type StayRow = { reservation_date?: unknown; duration_minutes?: unknown; status?: unknown; service_name?: unknown };

const INACTIVE = ['otkazano', 'cancelled', 'canceled', 'isteklo', 'expired'];
const norm = (v: unknown) => String(v ?? '').toLowerCase().trim();

// Zauzete noći jedne jedinice (usluge). Noć D je zauzeta ako boravak traje preko noći D (od dana D do D+1).
export function occupiedNights(rows: StayRow[], unitName: string): Set<string> {
  const out = new Set<string>();
  for (const row of rows) {
    if (INACTIVE.includes(norm(row.status))) continue;
    if (String(row.service_name ?? '').trim() !== unitName.trim()) continue;
    const start = typeof row.reservation_date === 'string' ? row.reservation_date.slice(0, 10) : '';
    if (!DATE_RE.test(start)) continue;
    const minutes = Number(row.duration_minutes);
    const startMin = Number(String(row.reservation_date).slice(11, 13)) * 60 + Number(String(row.reservation_date).slice(14, 16) || 0);
    const endDayOffset = Number.isFinite(minutes) && minutes > 0 ? Math.floor((startMin + minutes - 1) / 1440) : 0;
    // Boravak od dana dolaska do dana odlaska (isključivo): sve noći između.
    for (let i = 0; i < Math.max(1, endDayOffset); i += 1) out.add(addDays(start, i));
  }
  return out;
}

// Slobodan je ako nijedna noć boravka nije zauzeta niti zaključana.
export function stayIsFree(checkIn: string, checkOut: string, occupied: Set<string>, closed: string[] = []) {
  const closedSet = new Set(closed);
  return nightsOf(checkIn, checkOut).every((d) => !occupied.has(d) && !closedSet.has(d));
}
