import test from 'node:test';
import assert from 'node:assert/strict';
import {
  statusKind,
  allowedActions,
  canApply,
  actionFromLegacyStatus,
  findConflict,
  buildReservationPayload,
  TARGET_STATUS,
} from '../utils/reservationFlow.ts';

test('statusi: zahtjev, potvrđeno, dogovor, završeno, otkazano; stari zapisi su zahtjev', () => {
  for (const s of ['Na čekanju', 'Na cekanju', 'Aktivno', '', null, undefined, 'nešto drugo']) {
    assert.equal(statusKind(s), 'pending');
  }
  assert.equal(statusKind('Potvrđeno'), 'confirmed');
  assert.equal(statusKind('Dogovor termina'), 'rescheduling');
  assert.equal(statusKind('Završeno'), 'completed');
  assert.equal(statusKind('Otkazano'), 'cancelled');
});

test('dvostruka potvrda i promjena završenih/otkazanih nije moguća', () => {
  assert.ok(canApply('Na čekanju', 'confirm'));
  assert.ok(!canApply('Potvrđeno', 'confirm'));
  assert.deepEqual(allowedActions('Otkazano'), []);
  assert.deepEqual(allowedActions('Završeno'), []); // prihod se ne može poništiti otkazivanjem
  assert.ok(!canApply('Otkazano', 'confirm'));
  assert.ok(canApply('Potvrđeno', 'reschedule'));
});

test('ciljni statusi odgovaraju postojećim vrijednostima (prihod samo za Završeno)', () => {
  assert.equal(TARGET_STATUS.confirm, 'Potvrđeno');
  assert.equal(TARGET_STATUS.complete, 'Završeno');
  assert.equal(TARGET_STATUS.cancel, 'Otkazano');
  assert.equal(statusKind(TARGET_STATUS.reschedule), 'rescheduling');
  assert.notEqual(statusKind(TARGET_STATUS.reschedule), 'completed');
});

test('kompatibilnost: stari klijent šalje status', () => {
  assert.equal(actionFromLegacyStatus('Potvrđeno'), 'confirm');
  assert.equal(actionFromLegacyStatus('Završeno'), 'complete');
  assert.equal(actionFromLegacyStatus('Otkazano'), 'cancel');
  assert.equal(actionFromLegacyStatus('Na čekanju'), null);
});

const slot = (date: string, minutes: number, status = 'Potvrđeno', id = 'x') => ({
  id,
  reservation_date: date,
  duration_minutes: minutes,
  status,
});

test('preklapanje termina se otkriva, otkazani i susjedni termini ne smetaju', () => {
  const others = [slot('2026-10-20T10:00', 120, 'Potvrđeno', 'a'), slot('2026-10-20T14:00', 60, 'Otkazano', 'b')];
  const t = (iso: string) => new Date(iso).getTime();
  assert.ok(findConflict({ start: t('2026-10-20T11:00'), durationMinutes: 60 }, others));
  assert.equal(findConflict({ start: t('2026-10-20T12:00'), durationMinutes: 60 }, others), null); // odmah nakon
  assert.equal(findConflict({ start: t('2026-10-20T14:30'), durationMinutes: 60 }, others), null); // otkazani
  assert.equal(findConflict({ id: 'a', start: t('2026-10-20T10:30'), durationMinutes: 30 }, others), null); // isti zapis
});

test('push o rezervaciji: vodi na rezervaciju i ne sadrži ime/telefon klijenta', () => {
  const p = buildReservationPayload({ reservationId: 'r-1', kind: 'new-reservation', service: 'Pranje\r\nauta', when: '20.10.2026. 10:00' });
  assert.equal(p.url, '/dashboard/reservations?id=r-1');
  assert.ok(!/[\r\n]/.test(p.body));
  assert.notEqual(p.tag, buildReservationPayload({ reservationId: 'r-1', kind: 'cancelled-reservation' }).tag);
});

// Simulacija atomarne potvrde: dva istovremena klika, samo jedan uspije.
test('uvjetno ažuriranje (status mora biti nepromijenjen) puštaju samo jednu potvrdu', () => {
  const row = { status: 'Na čekanju' };
  const confirm = () => {
    const seen = row.status;
    if (!canApply(seen, 'confirm')) return false;
    // "UPDATE ... WHERE status = seen"
    if (row.status !== seen) return false;
    row.status = TARGET_STATUS.confirm;
    return true;
  };
  assert.equal(confirm(), true);
  assert.equal(confirm(), false);
});
