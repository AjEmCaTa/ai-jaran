import test from 'node:test';
import assert from 'node:assert/strict';
import { personalize, renderEmail, bodyToHtml, safeUrl, escapeHtml, personalPitch } from '../utils/marketingEmail.ts';
import { planNext, recentlyMailed, startOfLocalDay } from '../utils/marketingPlan.ts';
import { DEFAULT_SEQUENCES } from '../utils/marketingSequences.ts';

const ctx = { siteUrl: 'https://poslo.one', unsubscribeUrl: 'https://poslo.one/odjava?t=abc', reason: 'ste registrovali firmu na POSLO ONE', address: 'Mostar, Bosna i Hercegovina' };

test('personalizacija: ime, firma, grad i prazna vrijednost bez viška razmaka', () => {
  assert.equal(personalize('Pozdrav {{ime}}, {{firma}} iz {{grad}}', { owner_name: 'Harun Ćatić', company_name: 'Dubinsko', city: 'Mostar' }), 'Pozdrav Harun, Dubinsko iz Mostar');
  assert.equal(personalize('Pozdrav {{ime}},', { owner_name: '' }), 'Pozdrav,');
  assert.equal(personalize('Za {{firma}}', {}), 'Za vaša firma');
  assert.equal(personalize('{{ nepoznato }} ostaje', {}), '{{ nepoznato }} ostaje');
});

test('HTML: tekst se escapuje (nema ubacivanja koda kroz ime firme)', () => {
  const { html, subject } = renderEmail({ subject: 'Za {{firma}}', body: 'Pozdrav {{ime}}', heading: 'H' }, { owner_name: '<script>x</script>', company_name: 'A&B "C"' }, ctx);
  assert.ok(!html.includes('<script>x'));
  assert.ok(html.includes('&lt;script&gt;x'));
  assert.equal(subject, 'Za A&B "C"');
  assert.ok(html.includes('A&amp;B'));
});

test('HTML: lista, podebljano, dugme, podnožje s razlogom, adresom i odjavom', () => {
  const { html, text } = renderEmail(
    { subject: 'S', heading: 'Naslov', body: 'Uvod **važno**\n\n- jedan\n- dva', cta_label: 'Otvori', cta_url: '/dashboard' },
    { owner_name: 'Ana' },
    ctx
  );
  assert.ok(html.includes('<strong style="color:#0b0f1a">važno</strong>'));
  assert.ok(html.includes('jedan') && html.includes('dva'));
  assert.ok(html.includes('href="https://poslo.one/dashboard"'));
  assert.ok(html.includes('ste registrovali firmu na POSLO ONE'));
  assert.ok(html.includes('Mostar, Bosna i Hercegovina'));
  assert.ok(html.includes('https://poslo.one/odjava?t=abc'));
  assert.ok(text.includes('Odjava: https://poslo.one/odjava?t=abc'));
  assert.ok(text.includes('• jedan'));
});

test('dugme prihvata samo https ili link na naš sajt', () => {
  assert.equal(safeUrl('/demo', 'https://poslo.one'), 'https://poslo.one/demo');
  assert.equal(safeUrl('https://poslo.one/x', 'https://poslo.one'), 'https://poslo.one/x');
  assert.equal(safeUrl('javascript:alert(1)', 'https://poslo.one'), null);
  assert.equal(safeUrl('http://nesigurno.ba', 'https://poslo.one'), null);
  const { html } = renderEmail({ subject: 's', body: 'b', cta_label: 'Klik', cta_url: 'javascript:alert(1)' }, {}, ctx);
  assert.ok(!html.includes('javascript:'));
});

test('bodyToHtml i escapeHtml', () => {
  assert.equal(escapeHtml(`<a href="x">'`), '&lt;a href=&quot;x&quot;&gt;&#39;');
  assert.ok(bodyToHtml('red1\nred2').includes('red1<br>red2'));
});

test('planNext: šalje dospjeli korak, ne šalje buduće', () => {
  const steps = [
    { id: 'a', position: 1, delay_days: 0, enabled: true },
    { id: 'b', position: 2, delay_days: 2, enabled: true },
    { id: 'c', position: 3, delay_days: 5, enabled: true },
  ];
  const start = '2026-11-01T10:00:00Z';
  const at = (d: number) => Date.parse(start) + d * 86400000 + 60000;
  assert.equal(planNext(steps, start, new Set(), at(0)).send?.id, 'a');
  assert.equal(planNext(steps, start, new Set(['a']), at(1)).send, null);
  assert.equal(planNext(steps, start, new Set(['a']), at(2)).send?.id, 'b');
  assert.equal(planNext(steps, start, new Set(['a', 'b', 'c']), at(9)).send, null);
});

test('planNext: kasni ulazak u niz šalje samo najnoviji korak, stariji se preskaču', () => {
  const steps = [
    { id: 'a', position: 1, delay_days: 0, enabled: true },
    { id: 'b', position: 2, delay_days: 2, enabled: true },
    { id: 'c', position: 3, delay_days: 5, enabled: true },
    { id: 'd', position: 4, delay_days: 25, enabled: false },
  ];
  const start = '2026-11-01T10:00:00Z';
  const r = planNext(steps, start, new Set(), Date.parse(start) + 6 * 86400000);
  assert.equal(r.send?.id, 'c');
  assert.deepEqual(r.skip.map((s) => s.id), ['a', 'b']);
  // isključen korak se nikad ne šalje
  const r2 = planNext(steps, start, new Set(['a', 'b', 'c']), Date.parse(start) + 26 * 86400000);
  assert.equal(r2.send, null);
});

test('planNext: korak koji kasni više od 14 dana se preskače, ne šalje', () => {
  const steps = [{ id: 'a', position: 1, delay_days: 0, enabled: true }];
  const r = planNext(steps, '2026-01-01T00:00:00Z', new Set(), Date.parse('2026-02-01T00:00:00Z'));
  assert.equal(r.send, null);
  assert.deepEqual(r.skip.map((s) => s.id), ['a']);
});

test('razmak između mejlova istom kontaktu i početak dana po Sarajevu', () => {
  const now = Date.parse('2026-11-11T12:00:00Z');
  assert.equal(recentlyMailed('2026-11-11T00:00:00Z', now), true);
  assert.equal(recentlyMailed('2026-11-10T10:00:00Z', now), false);
  assert.equal(recentlyMailed(null, now), false);
  assert.equal(startOfLocalDay(Date.parse('2026-11-11T12:00:00Z')), '2026-11-10T23:00:00.000Z'); // CET
  assert.equal(startOfLocalDay(Date.parse('2026-07-01T12:00:00Z')), '2026-06-30T22:00:00.000Z'); // CEST
  assert.equal(startOfLocalDay(Date.parse('2026-11-10T23:30:00Z')), '2026-11-10T23:00:00.000Z');
});

test('početni nizovi: koraci poredani po danu, mejlovi o plaćanju isključeni dok plaćanje nije pravo', () => {
  for (const seq of DEFAULT_SEQUENCES) {
    const days = seq.steps.map((s) => s.delay_days);
    assert.deepEqual(days, [...days].sort((a, b) => a - b), seq.key);
    for (const s of seq.steps) {
      assert.ok(s.subject && s.body && s.cta_url.startsWith('https://poslo.one/'), s.subject);
      if (s.cta_url.endsWith('/paket')) assert.equal(s.enabled, false, s.subject);
    }
  }
});

test('poruka "Piši lično" je personalizovana i nudi da se više ne piše', () => {
  const p = personalPitch({ owner_name: 'Lana Kovač', company_name: 'Studio Lana', city: 'Sarajevo' });
  assert.equal(p.subject, 'Online zakazivanje za Studio Lana');
  assert.ok(p.body.startsWith('Pozdrav Lana,'));
  assert.ok(p.body.includes('više vam neću pisati'));
  assert.ok(personalPitch({}).body.startsWith('Pozdrav,'));
});
