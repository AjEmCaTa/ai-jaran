/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSubscription,
  buildInquiryPayload,
  safeDashboardPath,
  sendPushToBusiness,
  type PushStore,
} from '../utils/push.ts';

const goodSub = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u', auth: 'tBHItJI5svbpez7KI4CCXg' },
};

test('parseSubscription prihvata ispravnu, odbija neispravne', () => {
  assert.ok(parseSubscription(goodSub));
  assert.equal(parseSubscription(null), null);
  assert.equal(parseSubscription({ ...goodSub, endpoint: 'http://insecure.example/x' }), null);
  assert.equal(parseSubscription({ ...goodSub, endpoint: 'nije url' }), null);
  assert.equal(parseSubscription({ endpoint: goodSub.endpoint, keys: { p256dh: '<script>', auth: 'x' } }), null);
  assert.equal(parseSubscription({ endpoint: goodSub.endpoint }), null);
});

test('payload ne sadrži lične podatke i vodi na konkretan upit', () => {
  const p = buildInquiryPayload({ inquiryId: 'abc-123', service: 'Servis\r\nklime' });
  assert.equal(p.url, '/dashboard/inquiries?id=abc-123');
  assert.ok(!/\n|\r/.test(p.body));
  assert.ok(!JSON.stringify(p).includes('@'));
});

test('safeDashboardPath dopušta samo /dashboard na istom originu', () => {
  assert.equal(safeDashboardPath('/dashboard/inquiries?id=1'), '/dashboard/inquiries?id=1');
  assert.equal(safeDashboardPath('https://evil.example/dashboard'), '/dashboard/inquiries');
  assert.equal(safeDashboardPath('//evil.example/x'), '/dashboard/inquiries');
  assert.equal(safeDashboardPath('/admin'), '/dashboard/inquiries');
  assert.equal(safeDashboardPath(undefined), '/dashboard/inquiries');
});

// Lažna "baza" s pretplatama dvije firme; bilježi filtere.
function fakeStore(rows: { business_id: string; endpoint: string; p256dh: string; auth: string }[]) {
  const deleted: string[] = [];
  const store: PushStore = {
    from() {
      const filters: Record<string, string> = {};
      let inList: string[] = [];
      let isDelete = false;
      const q: any = {
        select: () => q,
        delete: () => ((isDelete = true), q),
        eq: (c: string, v: string) => ((filters[c] = v), q),
        in: (_c: string, v: string[]) => ((inList = v), q),
        then: (resolve: (r: unknown) => unknown) => {
          const matched = rows.filter((r) => r.business_id === filters.business_id);
          if (isDelete) {
            deleted.push(...matched.filter((r) => inList.includes(r.endpoint)).map((r) => r.endpoint));
            return Promise.resolve({ data: null, error: null }).then(resolve);
          }
          return Promise.resolve({ data: matched, error: null }).then(resolve);
        },
      };
      return q;
    },
  };
  return { store, deleted };
}

const rows = [
  { business_id: 'catic', endpoint: 'https://push.example/catic-1', p256dh: 'k', auth: 'a' },
  { business_id: 'catic', endpoint: 'https://push.example/catic-dead', p256dh: 'k', auth: 'a' },
  { business_id: 'sun', endpoint: 'https://push.example/sun-1', p256dh: 'k', auth: 'a' },
];
const payload = buildInquiryPayload({ inquiryId: 'i1' });

test('push za Ćatić ide samo na uređaje Ćatića, nikad Sun Solution', async () => {
  const { store } = fakeStore(rows);
  const targets: string[] = [];
  const result = await sendPushToBusiness(store, 'catic', payload, async (s) => {
    targets.push(s.endpoint);
  });
  assert.equal(result.sent, 2);
  assert.deepEqual(targets.sort(), ['https://push.example/catic-1', 'https://push.example/catic-dead']);
  assert.ok(!targets.some((t) => t.includes('sun')));
});

test('mrtve pretplate (410) se uklanjaju samo unutar iste firme', async () => {
  const { store, deleted } = fakeStore(rows);
  const result = await sendPushToBusiness(store, 'catic', payload, async (s) => {
    if (s.endpoint.endsWith('dead')) throw Object.assign(new Error('gone'), { statusCode: 410 });
  });
  assert.deepEqual(result, { sent: 1, failed: 0, removed: 1 });
  assert.deepEqual(deleted, ['https://push.example/catic-dead']);
});

test('greška slanja ne ruši ostale i firma bez pretplata ne šalje ništa', async () => {
  const { store } = fakeStore(rows);
  const failing = await sendPushToBusiness(store, 'sun', payload, async () => {
    throw new Error('mreža');
  });
  assert.deepEqual(failing, { sent: 0, failed: 1, removed: 0 });
  const none = await sendPushToBusiness(store, 'nepoznata', payload, async () => {});
  assert.deepEqual(none, { sent: 0, failed: 0, removed: 0 });
});

test('isti uređaj pretplaćen na dvije firme: svaka firma šalje samo svoj red, brisanje ne dira drugu', async () => {
  const shared = 'https://push.example/shared-device';
  const both = [
    { business_id: 'catic', endpoint: shared, p256dh: 'k', auth: 'a' },
    { business_id: 'sun', endpoint: shared, p256dh: 'k', auth: 'a' },
  ];
  const a = fakeStore(both);
  const first = await sendPushToBusiness(a.store, 'catic', payload, async () => {});
  assert.equal(first.sent, 1);
  const b = fakeStore(both);
  const second = await sendPushToBusiness(b.store, 'sun', payload, async () => {
    throw Object.assign(new Error('gone'), { statusCode: 410 });
  });
  assert.equal(second.removed, 1);
  assert.equal(b.deleted.length, 1);
});

test('migracija: jedinstvenost je (business_id, endpoint), a ne samo endpoint', async () => {
  const { readFileSync } = await import('node:fs');
  const sql = readFileSync(new URL('../supabase/migrations/20261012_push_and_inquiries.sql', import.meta.url), 'utf8');
  assert.match(sql, /unique index if not exists push_subscriptions_business_endpoint_uidx\s+on public\.push_subscriptions \(business_id, endpoint\)/);
  assert.doesNotMatch(sql, /endpoint text not null unique/);
  assert.match(sql, /enable row level security/);
});

test('push o rezervaciji Ćatića ne stiže Sun Solution uređajima', async () => {
  const { buildReservationPayload } = await import('../utils/reservationFlow.ts');
  const { store } = fakeStore(rows);
  const targets: string[] = [];
  await sendPushToBusiness(store, 'catic', buildReservationPayload({ reservationId: 'r1', kind: 'new-reservation' }), async (s) => {
    targets.push(s.endpoint);
  });
  assert.ok(targets.length > 0 && targets.every((t) => t.includes('catic')));
});
