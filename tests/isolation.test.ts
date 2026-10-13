import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyGoalKey, lastSeenKey, bookingLinkKey } from '../app/dashboard/_lib/storage-keys.ts';

const A = 'business-sun-solution';
const B = 'business-dubinsko-catic';

test('ključevi dvije firme se razlikuju', () => {
  for (const fn of [monthlyGoalKey, lastSeenKey, bookingLinkKey]) {
    assert.notEqual(fn(A), fn(B));
  }
});

test('stari globalni ključevi se ne poklapaju s novim', () => {
  assert.notEqual(monthlyGoalKey(A), 'poslo-monthly-goal');
  assert.notEqual(lastSeenKey(A), 'poslo-last-seen');
  assert.notEqual(bookingLinkKey(A), 'poslo-booking-link');
});

test('cilj firme A ne utiče na firmu B (simulirani storage)', () => {
  const store = new Map<string, string>();
  store.set('poslo-monthly-goal', '5000'); // naslijeđena globalna vrijednost
  store.set(monthlyGoalKey(B), '3000');
  assert.equal(store.get(monthlyGoalKey(A)), undefined);
  store.set(monthlyGoalKey(A), '800');
  assert.equal(store.get(monthlyGoalKey(B)), '3000');
});
