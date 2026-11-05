import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRebookMessage, buildReviewMessage, processRebookReminders, safeHttpUrl } from '../utils/growthEmails.ts';

test('safeHttpUrl prihvata samo http(s)', () => {
  assert.equal(safeHttpUrl('g.page/r/abc'), 'https://g.page/r/abc');
  assert.equal(safeHttpUrl('https://g.page/r/abc'), 'https://g.page/r/abc');
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl(''), '');
});

test('mailovi escapeuju HTML i sadrže link', () => {
  const row = { customer_name: '<b>Ana</b>', service_name: 'Šišanje' };
  const r = buildReviewMessage('Studio <x>', row, 'https://g.page/r/abc');
  assert.ok(!r.html.includes('<b>Ana</b>'));
  assert.ok(r.html.includes('https://g.page/r/abc'));
  const b = buildRebookMessage('Studio', row, 'https://poslo.one/katalog/studio');
  assert.ok(b.html.includes('https://poslo.one/katalog/studio'));
  assert.ok(b.subject.includes('Studio'));
});

// Minimalni lažni Supabase klijent za upite koje koristi processRebookReminders.
function fakeAdmin(businesses: Record<string, unknown>[], reservations: Record<string, unknown>[]) {
  const updates: { id: unknown; set: Record<string, unknown> }[] = [];
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    let set: Record<string, unknown> | null = null;
    const rows = () => (table === 'businesses' ? businesses : reservations).filter((r) => filters.every(([k, v]) => r[k] === v));
    const q = {
      select: () => q,
      not: () => q,
      is: (k: string, v: unknown) => { filters.push([k, v === null ? undefined : v]); return q; },
      eq: (k: string, v: unknown) => { filters.push([k, v]); return q; },
      update: (s: Record<string, unknown>) => { set = s; return q; },
      maybeSingle: async () => {
        const hit = rows()[0] || (set && 'rebook_sent_at' in set && set.rebook_sent_at === null ? reservations.find((r) => r.id === filters[0][1]) : undefined);
        if (set && hit) { Object.assign(hit, set); updates.push({ id: hit.id, set }); }
        return { data: hit ? { id: hit.id } : null, error: null };
      },
      then: (resolve: (v: unknown) => void) => {
        if (set) { for (const r of rows()) Object.assign(r, set); updates.push({ id: filters[0]?.[1], set }); }
        resolve({ data: set ? null : rows(), error: null });
      },
    };
    return q;
  };
  return { admin: { from } as never, updates };
}

test('poziv na povratak: šalje samo starim završenim bez novijeg termina, jednom po klijentu', async () => {
  const now = Date.parse('2026-11-05T12:00');
  const biz = [{ id: 'b1', name: 'Studio', slug: 'studio', rebook_weeks: 4, is_active: true }];
  const res = [
    { id: 'r1', business_id: 'b1', customer_email: 'ana@x.ba', reservation_date: '2026-09-01T10:00', status: 'Završeno' },
    { id: 'r2', business_id: 'b1', customer_email: 'ana@x.ba', reservation_date: '2026-09-20T10:00', status: 'Završeno' },
    { id: 'r3', business_id: 'b1', customer_email: 'emir@x.ba', reservation_date: '2026-09-01T10:00', status: 'Završeno' },
    { id: 'r4', business_id: 'b1', customer_email: 'emir@x.ba', reservation_date: '2026-11-20T10:00', status: 'Na čekanju' },
    { id: 'r5', business_id: 'b1', customer_email: 'mia@x.ba', reservation_date: '2026-10-25T10:00', status: 'Završeno' },
  ];
  const { admin } = fakeAdmin(biz, res);
  const sentTo: string[] = [];
  const out = await processRebookReminders(admin, now, 20, async (to) => { sentTo.push(to); return true; });
  assert.deepEqual(sentTo, ['ana@x.ba']); // emir ima novi termin, mia prerano
  assert.equal(out.rebookSent, 1);
  assert.ok(res.find((r) => r.id === 'r2')!.rebook_sent_at);
  const again: string[] = [];
  await processRebookReminders(admin, now, 20, async (to) => { again.push(to); return true; });
  assert.deepEqual(again, []);
});

import { categoryOf } from '../utils/catalog.ts';
import { canEditCatalogData, normalizePlan } from '../utils/plan.ts';

test('kategorija iz upisane djelatnosti', () => {
  assert.equal(categoryOf('dubinsko-ciscenje'), 'dubinsko-ciscenje');
  assert.equal(categoryOf('Solarni sistemi i elektroinstalacije'), 'solarni-sistemi');
  assert.equal(categoryOf('frizerski salon'), 'beauty-saloni');
  assert.equal(categoryOf('Vulkanizer'), 'ostale-usluge');
  assert.equal(categoryOf(''), 'ostale-usluge');
});

test('paketi: starter ne uređuje, pro i nepoznato uređuju', () => {
  assert.equal(canEditCatalogData('starter'), false);
  assert.equal(canEditCatalogData('pro'), true);
  assert.equal(normalizePlan(null), 'pro');
});
