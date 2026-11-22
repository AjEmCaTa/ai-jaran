import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bankReference, hasPaidAccess, requiresPaymentSetup } from '../utils/billingAccess.ts';
import { trialDaysLeft, mapDodoStatus, verifyDodoSignature } from '../utils/dodo.ts';
import crypto from 'node:crypto';

const now = Date.parse('2026-12-01T12:00:00Z');

test('stare firme ne moraju odmah plaćati', () => {
  assert.equal(requiresPaymentSetup({ created_at: '2026-11-21T10:00:00Z' }, true, now), false);
  assert.equal(requiresPaymentSetup({ created_at: '2026-11-25T10:00:00Z' }, true, now), true);
  assert.equal(requiresPaymentSetup({ created_at: '2026-11-25T10:00:00Z' }, false, now), false);
});

test('pristup: aktivna, uplatnica, otkazana do kraja perioda', () => {
  assert.equal(hasPaidAccess({ billing_status: 'active' }, now), true);
  assert.equal(hasPaidAccess({ billing_provider: 'bank', billing_status: 'bank_pending' }, now), true);
  assert.equal(hasPaidAccess({ billing_status: 'cancelled', plan_until: '2026-12-10T00:00:00Z' }, now), true);
  assert.equal(hasPaidAccess({ billing_status: 'cancelled', plan_until: '2026-11-10T00:00:00Z' }, now), false);
  assert.equal(hasPaidAccess({ billing_status: 'suspended' }, now), false);
});

test('preostali besplatni dani', () => {
  assert.equal(trialDaysLeft('2026-12-01T00:00:00Z', false, now), 30);
  assert.equal(trialDaysLeft('2026-11-21T00:00:00Z', false, now), 20);
  assert.equal(trialDaysLeft('2026-09-01T00:00:00Z', false, now), 0);
  assert.equal(trialDaysLeft('2026-12-01T00:00:00Z', true, now), 0);
});

test('Dodo statusi', () => {
  assert.equal(mapDodoStatus('active'), 'active');
  assert.equal(mapDodoStatus('on_hold'), 'suspended');
  assert.equal(mapDodoStatus('failed'), 'expired');
});

test('poziv na broj', () => {
  assert.equal(bankReference('00000000-0000-4000-a000-00000000de30'), 'PO-00000000');
});

test('Dodo potpis (Standard Webhooks)', () => {
  const key = crypto.randomBytes(24);
  process.env.DODO_PAYMENTS_WEBHOOK_KEY = `whsec_${key.toString('base64')}`;
  const body = '{"type":"subscription.active"}';
  const ts = String(Math.floor(now / 1000));
  const sig = crypto.createHmac('sha256', key).update(`msg_1.${ts}.${body}`).digest('base64');
  assert.equal(verifyDodoSignature(body, { id: 'msg_1', timestamp: ts, signature: `v1,${sig}` }, now), true);
  assert.equal(verifyDodoSignature(body + ' ', { id: 'msg_1', timestamp: ts, signature: `v1,${sig}` }, now), false);
  assert.equal(verifyDodoSignature(body, { id: 'msg_1', timestamp: String(Number(ts) - 3600), signature: `v1,${sig}` }, now), false);
});

test('trajno besplatna firma nikad ne mora plaćati', () => {
  assert.equal(hasPaidAccess({ billing_provider: 'free', billing_status: 'active' }), true);
  assert.equal(requiresPaymentSetup({ created_at: '2027-01-01T00:00:00Z', billing_provider: 'free' }, true, Date.parse('2027-03-01T00:00:00Z')), false);
});
