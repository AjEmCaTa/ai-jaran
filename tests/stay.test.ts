import test from 'node:test';
import assert from 'node:assert/strict';
import { planStay, occupiedNights, stayIsFree, nightsBetween, nightsOf, checkInTime, isStayCategory, addDays } from '../utils/stay.ts';

test('broj noći i noći boravka', () => {
  assert.equal(nightsBetween('2026-12-01', '2026-12-04'), 3);
  assert.deepEqual(nightsOf('2026-12-30', '2027-01-02'), ['2026-12-30', '2026-12-31', '2027-01-01']);
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
});

test('vrijeme prijave: radno vrijeme od 11h, inače 14h', () => {
  assert.equal(checkInTime('13:00:00'), '13:00');
  assert.equal(checkInTime('08:00:00'), '14:00');
  assert.equal(checkInTime(null), '14:00');
});

test('plan boravka: početak u vrijeme prijave, kraj u 10h na dan odlaska', () => {
  const p = planStay('2026-12-01', '2026-12-03', '14:00:00');
  assert.ok(!('error' in p));
  if ('error' in p) return;
  assert.equal(p.reservationDate, '2026-12-01T14:00:00');
  assert.equal(p.nights, 2);
  assert.equal(p.durationMinutes, 2 * 1440 - 14 * 60 + 10 * 60);
  assert.ok('error' in planStay('2026-12-03', '2026-12-03', null));
  assert.ok('error' in planStay('2026-12-03', '2026-12-01', null));
  assert.ok('error' in planStay('2026-12-01', '2027-03-01', null));
  assert.ok('error' in planStay('nije', '2026-12-01', null));
});

test('zauzete noći se računaju po apartmanu, otkazani se ne broje', () => {
  const p = planStay('2026-12-01', '2026-12-03', null);
  if ('error' in p) throw new Error(p.error);
  const rows = [
    { reservation_date: p.reservationDate, duration_minutes: p.durationMinutes, status: 'Potvrđeno', service_name: 'Apartman A' },
    { reservation_date: '2026-12-05T14:00:00', duration_minutes: 1260, status: 'Otkazano', service_name: 'Apartman A' },
    { reservation_date: '2026-12-01T14:00:00', duration_minutes: 1260, status: 'Potvrđeno', service_name: 'Apartman B' },
  ];
  const a = occupiedNights(rows, 'Apartman A');
  assert.deepEqual([...a].sort(), ['2026-12-01', '2026-12-02']);
  // odlazak 3.12. u 10h, novi gost može doći 3.12.
  assert.equal(stayIsFree('2026-12-03', '2026-12-05', a), true);
  assert.equal(stayIsFree('2026-11-30', '2026-12-02', a), false);
  assert.equal(stayIsFree('2026-12-05', '2026-12-07', a, ['2026-12-06']), false);
});

test('kategorija s noćenjima', () => {
  assert.equal(isStayCategory('vile-apartmani'), true);
  assert.equal(isStayCategory('beauty-saloni'), false);
});
