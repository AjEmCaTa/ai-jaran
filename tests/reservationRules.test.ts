import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reservationStartMs,
  customerCancelDecision,
  selectExpired,
  selectReminders,
  CANCEL_MIN_NOTICE_MIN,
  runReservationLifecycle,
} from '../utils/reservationRules.ts';
import { statusKind, findConflict, canApply } from '../utils/reservationFlow.ts';

const H = 3600000;
const MIN = 60000;

test('vrijeme bez zone se tumači kao Europe/Sarajevo (zimi UTC+1, ljeti UTC+2)', () => {
  assert.equal(reservationStartMs('2026-12-15T10:00'), Date.UTC(2026, 11, 15, 9, 0));
  assert.equal(reservationStartMs('2026-07-15T10:00'), Date.UTC(2026, 6, 15, 8, 0));
  assert.equal(reservationStartMs('2026-07-15T10:00:00Z'), Date.UTC(2026, 6, 15, 10, 0)); // zona se poštuje
  assert.equal(reservationStartMs('nije datum'), null);
  assert.equal(reservationStartMs(''), null);
  assert.equal(reservationStartMs(null), null);
});

test('prelazak na zimsko vrijeme 2026-10-25 (03:00 -> 02:00)', () => {
  assert.equal(reservationStartMs('2026-10-25T12:00'), Date.UTC(2026, 9, 25, 11, 0)); // već zimsko
  assert.equal(reservationStartMs('2026-10-24T12:00'), Date.UTC(2026, 9, 24, 10, 0)); // još ljetno
});

test('otkazivanje: tačno 2 sata je dozvoljeno, 1 sat 59 minuta nije', () => {
  const start = reservationStartMs('2026-11-10T14:00')!;
  assert.equal(CANCEL_MIN_NOTICE_MIN, 120);
  assert.deepEqual(customerCancelDecision('2026-11-10T14:00', start - 2 * H), { ok: true });
  assert.deepEqual(customerCancelDecision('2026-11-10T14:00', start - 3 * H), { ok: true });
  const late = customerCancelDecision('2026-11-10T14:00', start - 2 * H + MIN);
  assert.equal(late.ok, false);
  assert.equal(!late.ok && late.code, 'too-late');
  assert.equal((customerCancelDecision('2026-11-10T14:00', start - 5 * MIN) as any).code, 'too-late');
  assert.equal((customerCancelDecision('2026-11-10T14:00', start + MIN) as any).code, 'already-started');
  assert.equal((customerCancelDecision('smeće', start) as any).code, 'invalid-date');
});

test('otkazivanje koristi lokalno vrijeme: u 12:30 po Sarajevu termin u 14:00 se ne može otkazati (zima)', () => {
  const now = Date.UTC(2026, 10, 10, 11, 30); // 12:30 u Sarajevu
  assert.equal(customerCancelDecision('2026-11-10T14:00', now).ok, false);
  const earlier = Date.UTC(2026, 10, 10, 11, 0); // 12:00 u Sarajevu, tačno 2 h
  assert.equal(customerCancelDecision('2026-11-10T14:00', earlier).ok, true);
});

test('istek: zahtjev nakon 24 h od kreiranja ističe, svjež ne; potvrđeni i završeni nikad', () => {
  const now = Date.UTC(2026, 10, 10, 12, 0);
  const rows = [
    { id: 'staro', status: 'Na čekanju', created_at: new Date(now - 25 * H).toISOString(), reservation_date: '2026-11-20T10:00' },
    { id: 'tacno24', status: null, created_at: new Date(now - 24 * H).toISOString(), reservation_date: '2026-11-20T10:00' },
    { id: 'svjeze', status: 'Na čekanju', created_at: new Date(now - 23 * H).toISOString(), reservation_date: '2026-11-20T10:00' },
    { id: 'potvrdjeno', status: 'Potvrđeno', created_at: new Date(now - 90 * H).toISOString(), reservation_date: '2026-11-20T10:00' },
    { id: 'zavrseno', status: 'Završeno', created_at: new Date(now - 90 * H).toISOString(), reservation_date: '2026-11-01T10:00' },
    { id: 'otkazano', status: 'Otkazano', created_at: new Date(now - 90 * H).toISOString(), reservation_date: '2026-11-20T10:00' },
    { id: 'dogovor', status: 'Dogovor termina', created_at: new Date(now - 90 * H).toISOString(), reservation_date: '2026-11-20T10:00' },
  ];
  assert.deepEqual(selectExpired(rows, now).map((r) => r.id).sort(), ['staro', 'tacno24']);
});

test('istek: zahtjev čiji je termin počeo ističe i prije 24 h', () => {
  const now = Date.UTC(2026, 10, 10, 12, 0);
  const row = { id: 'x', status: 'Na čekanju', created_at: new Date(now - 2 * H).toISOString(), reservation_date: '2026-11-10T12:30' }; // 11:30 UTC
  assert.equal(selectExpired([row], now).length, 1);
  assert.equal(selectExpired([{ ...row, reservation_date: '2026-11-10T14:00' }], now).length, 0); // 13:00 UTC, u budućnosti
});

test('podsjetnik: samo potvrđeni, u narednih 24 h, jednom, s emailom', () => {
  const now = Date.UTC(2026, 10, 10, 12, 0); // 13:00 u Sarajevu
  const base = { status: 'Potvrđeno', customer_email: 'a@b.ba', reminder_sent_at: null };
  const rows = [
    { ...base, id: 'za23h', reservation_date: '2026-11-11T11:00' }, // 10:00 UTC sutra = 22 h
    { ...base, id: 'tacno24', reservation_date: '2026-11-11T13:00' }, // 12:00 UTC sutra = 24 h
    { ...base, id: 'za25h', reservation_date: '2026-11-11T14:00' }, // 25 h
    { ...base, id: 'proslo', reservation_date: '2026-11-10T12:00' },
    { ...base, id: 'vecposlan', reservation_date: '2026-11-11T11:00', reminder_sent_at: '2026-11-10T08:00:00Z' },
    { ...base, id: 'bezemaila', reservation_date: '2026-11-11T11:00', customer_email: '' },
    { ...base, id: 'zahtjev', status: 'Na čekanju', reservation_date: '2026-11-11T11:00' },
    { ...base, id: 'otkazano', status: 'Otkazano', reservation_date: '2026-11-11T11:00' },
  ];
  assert.deepEqual(selectReminders(rows, now).map((r) => r.id).sort(), ['tacno24', 'za23h']);
});

test('istekli termin je slobodan: ne računa se u preklapanje, i ne može se ponovo potvrditi', () => {
  assert.equal(statusKind('Isteklo'), 'expired');
  assert.equal(canApply('Isteklo', 'confirm'), false);
  const start = reservationStartMs('2026-11-10T10:00')!;
  const busy = [{ id: '1', reservation_date: '2026-11-10T10:00', duration_minutes: 60, status: 'Isteklo' }];
  assert.equal(findConflict({ start, durationMinutes: 60 }, busy), null);
  busy[0].status = 'Potvrđeno';
  assert.ok(findConflict({ start, durationMinutes: 60 }, busy));
  busy[0].status = 'Otkazano';
  assert.equal(findConflict({ start, durationMinutes: 60 }, busy), null);
});

test('sprječavanje duplih rezervacija: preklapanje, susjedni termini, druga firma', () => {
  const t = (s: string) => reservationStartMs(s)!;
  const existing = [{ id: 'a', reservation_date: '2026-11-10T10:00', duration_minutes: 60, status: 'Potvrđeno' }];
  assert.ok(findConflict({ start: t('2026-11-10T10:30'), durationMinutes: 60 }, existing)); // preklapa
  assert.ok(findConflict({ start: t('2026-11-10T09:30'), durationMinutes: 60 }, existing));
  assert.ok(findConflict({ start: t('2026-11-10T10:00'), durationMinutes: 30 }, existing)); // isti početak
  assert.equal(findConflict({ start: t('2026-11-10T11:00'), durationMinutes: 60 }, existing), null); // odmah poslije
  assert.equal(findConflict({ start: t('2026-11-10T09:00'), durationMinutes: 60 }, existing), null); // odmah prije
});

// ---------- runReservationLifecycle s lažnom bazom ----------
function fakeAdmin(initial: Record<string, any>[]) {
  const rows = initial.map((r) => ({ ...r }));
  const log: string[] = [];
  const builder = (patch: any | null) => {
    const filters: Array<(r: any) => boolean> = [];
    const q: any = {
      eq(c: string, v: any) { filters.push((r) => r[c] === v); return q; },
      is(c: string, v: any) { filters.push((r) => (r[c] ?? null) === v); return q; },
      select() { return q; },
      order() { return q; },
      range() { return Promise.resolve({ data: rows.map((r) => ({ ...r })), error: null }); },
      maybeSingle() {
        const hit = rows.filter((r) => filters.every((f) => f(r)));
        if (patch && hit[0]) { Object.assign(hit[0], patch); log.push('update:' + hit[0].id + ':' + JSON.stringify(patch)); }
        return Promise.resolve({ data: hit[0] ? { id: hit[0].id } : null, error: null });
      },
      then(res: any) { // update bez maybeSingle
        const hit = rows.filter((r) => filters.every((f) => f(r)));
        if (patch) hit.forEach((r) => Object.assign(r, patch));
        return Promise.resolve({ data: null, error: null }).then(res);
      },
    };
    return q;
  };
  const admin: any = { from: () => ({ select: () => builder(null), update: (patch: any) => builder(patch) }) };
  return { admin, rows, log };
}

test('lifecycle: ističe stare zahtjeve, šalje podsjetnik jednom, drugi prolaz ne radi ništa', async () => {
  const now = Date.UTC(2026, 10, 10, 12, 0);
  const { admin, rows } = fakeAdmin([
    { id: 'staro', status: 'Na čekanju', created_at: new Date(now - 30 * H).toISOString(), reservation_date: '2026-11-20T10:00', reminder_sent_at: null },
    { id: 'conf', status: 'Potvrđeno', created_at: new Date(now - 30 * H).toISOString(), reservation_date: '2026-11-11T11:00', customer_email: 'k@x.ba', reminder_sent_at: null },
  ]);
  const sent: string[] = [];
  const send = async (r: any) => { sent.push(r.id); return true; };
  const first = await runReservationLifecycle(admin, now, send);
  assert.deepEqual({ e: first.expired, r: first.reminded }, { e: 1, r: 1 });
  assert.equal(rows.find((r) => r.id === 'staro')!.status, 'Isteklo');
  assert.ok(rows.find((r) => r.id === 'conf')!.reminder_sent_at);
  const second = await runReservationLifecycle(admin, now + 5 * MIN, send);
  assert.deepEqual({ e: second.expired, r: second.reminded }, { e: 0, r: 0 });
  assert.deepEqual(sent, ['conf']); // tačno jedan podsjetnik
});

test('lifecycle: neuspjelo slanje vraća oznaku pa se pokušava ponovo', async () => {
  const now = Date.UTC(2026, 10, 10, 12, 0);
  const { admin, rows } = fakeAdmin([
    { id: 'c', status: 'Potvrđeno', created_at: new Date(now - H).toISOString(), reservation_date: '2026-11-11T11:00', customer_email: 'k@x.ba', reminder_sent_at: null },
  ]);
  const failed = await runReservationLifecycle(admin, now, async () => false);
  assert.equal(failed.reminderFailed, 1);
  assert.equal(rows[0].reminder_sent_at, null);
  const retry = await runReservationLifecycle(admin, now + 10 * MIN, async () => true);
  assert.equal(retry.reminded, 1);
});

test('lifecycle: ne dira otkazane, završene ni tuđe statuse', async () => {
  const now = Date.UTC(2026, 10, 10, 12, 0);
  const old = new Date(now - 99 * H).toISOString();
  const { admin, rows } = fakeAdmin([
    { id: 'o', status: 'Otkazano', created_at: old, reservation_date: '2026-11-01T10:00' },
    { id: 'z', status: 'Završeno', created_at: old, reservation_date: '2026-11-01T10:00' },
  ]);
  const s = await runReservationLifecycle(admin, now, async () => true);
  assert.deepEqual({ e: s.expired, r: s.reminded, scanned: s.scanned }, { e: 0, r: 0, scanned: 0 });
  assert.deepEqual(rows.map((r) => r.status), ['Otkazano', 'Završeno']);
});
