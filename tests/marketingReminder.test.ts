import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SEQUENCES, isPaymentReminder } from '../utils/marketingSequences.ts';

test('samo dan 25 i 29 niza za nove firme su podsjetnici za plaćanje', () => {
  const trial = DEFAULT_SEQUENCES.find((s) => s.audience === 'trial')!;
  const reminders = trial.steps.filter(isPaymentReminder).map((s) => s.delay_days);
  assert.deepEqual(reminders, [25, 29]);
});

test('tekstovi e-mailova ne obećavaju nešto što ne radimo', () => {
  const all = JSON.stringify(DEFAULT_SEQUENCES);
  assert.doesNotMatch(all, /bez kartice/i);
  assert.doesNotMatch(all, /postavimo/i);
  assert.doesNotMatch(all, /\bmejl/i);
  assert.doesNotMatch(all, /potvrđen/i);
});
