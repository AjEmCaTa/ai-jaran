import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, resetRateLimits, clientIp } from '../utils/rateLimit.ts';

test('dozvoljava do limita, zatim blokira s retry-after', () => {
  resetRateLimits();
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(checkRateLimit('a', 3, 60_000, t0 + i).allowed, true);
  const blocked = checkRateLimit('a', 3, 60_000, t0 + 10);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1 && blocked.retryAfterSec <= 60);
});

test('nakon isteka prozora ponovo dozvoljava; ključevi su odvojeni', () => {
  resetRateLimits();
  const t0 = 2_000_000;
  for (let i = 0; i < 2; i++) checkRateLimit('a', 2, 1000, t0);
  assert.equal(checkRateLimit('a', 2, 1000, t0 + 10).allowed, false);
  assert.equal(checkRateLimit('b', 2, 1000, t0 + 10).allowed, true);
  assert.equal(checkRateLimit('a', 2, 1000, t0 + 1001).allowed, true);
});

test('IP se uzima iz prvog x-forwarded-for unosa', () => {
  const req = { headers: new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }) };
  assert.equal(clientIp(req), '1.2.3.4');
  assert.equal(clientIp({ headers: new Headers() }), 'unknown');
});
