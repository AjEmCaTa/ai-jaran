#!/usr/bin/env node
// E2E test POSLO ONE na izoliranom Previewu + TEST Supabase projektu (woixwqpnpqteguntgmcq).
// Pokreće se lokalno (Node 20+, bez zavisnosti). Ključevi ostaju u tvom terminalu; ništa se ne šalje nikome.
//
//   PREVIEW_URL=https://<preview>.vercel.app TEST_SUPABASE_URL=https://woixwqpnpqteguntgmcq.supabase.co \
//   TEST_ANON_KEY=... TEST_SERVICE_ROLE_KEY=... CRON_SECRET=... [BYPASS_SECRET=...] node scripts/e2e-preview.mjs
//
// Sigurnosne ograde: staje ako URL nije TEST projekat ili ako PREVIEW_URL liči na produkciju.
// Piše samo u TEST bazu (korisnici *@example.com s nasumičnim sufiksom). Produkciji ne pristupa.
const env = process.env;
const need = ['PREVIEW_URL', 'TEST_SUPABASE_URL', 'TEST_ANON_KEY', 'TEST_SERVICE_ROLE_KEY', 'CRON_SECRET'];
for (const k of need) if (!env[k]) { console.error('Nedostaje ' + k); process.exit(2); }
const SB = env.TEST_SUPABASE_URL.replace(/\/$/, '');
const PV = env.PREVIEW_URL.replace(/\/$/, '');
if (!SB.includes('woixwqpnpqteguntgmcq') || SB.includes('qpptpbjksrqfqjunggrq')) { console.error('ZAUSTAVLJENO: TEST_SUPABASE_URL nije TEST projekat.'); process.exit(2); }
if (/(^|\/\/|\.)(poslo\.one|aijaran\.ba)(\/|$)/.test(PV)) { console.error('ZAUSTAVLJENO: PREVIEW_URL je produkcijska domena.'); process.exit(2); }

const ANON = env.TEST_ANON_KEY, SVC = env.TEST_SERVICE_ROLE_KEY;
const results = [];
const check = (name, expected, observed, pass) => { results.push({ name, expected, observed, pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : '  | očekivano: ' + expected + ' | dobijeno: ' + observed)); };
const eq = (name, expected, observed) => check(name, String(expected), String(observed), expected === observed);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = Math.random().toString(36).slice(2, 8);

async function app(method, path, { token, body, headers } = {}) {
  const h = { 'Content-Type': 'application/json', ...(headers || {}) };
  if (token) h.Authorization = 'Bearer ' + token;
  if (env.BYPASS_SECRET) h['x-vercel-protection-bypass'] = env.BYPASS_SECRET;
  const url = new URL(PV + path);
  if (env.VERCEL_SHARE) url.searchParams.set('_vercel_share', env.VERCEL_SHARE);
  const res = await fetch(url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
async function rest(method, path, { key = SVC, token, body, prefer } = {}) {
  const res = await fetch(SB + '/rest/v1/' + path, {
    method,
    headers: { apikey: key, Authorization: 'Bearer ' + (token || key), 'Content-Type': 'application/json', Prefer: prefer || 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}
async function signUpDirect(email, password) {
  // Preko Auth API-ja TEST projekta (potvrda emaila mora biti isključena u TEST Auth postavkama).
  const res = await fetch(SB + '/auth/v1/signup', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return { status: res.status, json: await res.json().catch(() => null) };
}
async function signIn(email, password) {
  const res = await fetch(SB + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const json = await res.json().catch(() => null);
  return { status: res.status, token: json?.access_token, id: json?.user?.id };
}

// Lokalno (Sarajevo) zidno vrijeme 'YYYY-MM-DDTHH:mm' za trenutak now + minutes.
function wall(minutesFromNow, base = Date.now()) {
  const d = new Date(base + minutesFromNow * 60000);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// Slobodan termin u budućnosti, različit po testu: dan + offset, 10:00 Sarajevo.
function slot(dayOffset, hour = 10, minute = 0) {
  const d = new Date(Date.now() + dayOffset * 86400000);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
const getRes = async (id) => (await rest('GET', 'reservations?id=eq.' + id + '&select=*')).json?.[0];

(async () => {
  const pw = 'Test-' + rnd + '-Pass1';
  const emailA = `poslo.e2e.a.${rnd}@example.com`, emailB = `poslo.e2e.b.${rnd}@example.com`;
  const emailC1 = `poslo.e2e.c1.${rnd}@example.com`, emailC2 = `poslo.e2e.c2.${rnd}@example.com`;

  // ===== 0. Izolacija =====
  const health = await app('GET', '/registracija');
  check('Preview dostupan (HTTP 200)', '200', String(health.status), health.status === 200);
  if (health.status !== 200) { console.error('Preview nije dostupan (zaštita deploymenta? postavi BYPASS_SECRET). Prekidam.'); process.exit(1); }
  const prodCheck = await rest('GET', 'businesses?select=slug&slug=eq.dubinsko-catic');
  eq('TEST baza NE sadrži produkcijski biznis dubinsko-catic', 0, Array.isArray(prodCheck.json) ? prodCheck.json.length : -1);
  const prodApi = await app('GET', '/api/business-profile?slug=dubinsko-catic');
  eq('Preview API ne vraća produkcijski biznis (404)', 404, prodApi.status);

  // ===== 1. Registracija firmi =====
  const regA = await app('POST', '/api/register-business', { body: { ownerName: 'Vlasnik A', businessName: 'E2E Firma A ' + rnd, email: emailA, password: pw, city: 'Mostar', phone: '061111111', category: 'frizer', status: 'active', business_id: '00000000-0000-0000-0000-000000000000' } });
  eq('Registracija firme A (200)', 200, regA.status);
  const regB = await app('POST', '/api/register-business', { body: { ownerName: 'Vlasnik B', businessName: 'E2E Firma B ' + rnd, email: emailB, password: pw } });
  eq('Registracija firme B (200)', 200, regB.status);
  const regDup = await app('POST', '/api/register-business', { body: { ownerName: 'Vlasnik A', businessName: 'Duplikat', email: emailA, password: pw } });
  eq('Ista email adresa se ne registruje dvaput (409)', 409, regDup.status);
  const regBad = await app('POST', '/api/register-business', { body: { ownerName: '', businessName: 'x', email: 'nije-email', password: '1' } });
  eq('Neispravna registracija odbijena (400)', 400, regBad.status);
  const sA = await signIn(emailA, pw), sB = await signIn(emailB, pw);
  eq('Prijava vlasnika A (200)', 200, sA.status); eq('Prijava vlasnika B (200)', 200, sB.status);
  if (!sA.token || !sB.token) { console.error('Prijava nije uspjela (je li "Confirm email" isključen u TEST Auth?).'); process.exit(1); }
  const profA = (await rest('GET', 'profiles?id=eq.' + sA.id + '&select=business_id')).json?.[0];
  const profB = (await rest('GET', 'profiles?id=eq.' + sB.id + '&select=business_id')).json?.[0];
  const bizA = (await rest('GET', 'businesses?id=eq.' + profA?.business_id + '&select=*')).json?.[0];
  const bizB = (await rest('GET', 'businesses?id=eq.' + profB?.business_id + '&select=*')).json?.[0];
  eq('Firma A je kreirana sa statusom pending (klijentski status:active ignorisan)', 'pending', bizA?.status);
  eq('Firma B je kreirana sa statusom pending', 'pending', bizB?.status);
  check('Profil A vezan za svoju firmu, ne za poslani business_id', 'različit od 0000…', String(profA?.business_id), !!profA?.business_id && profA.business_id !== '00000000-0000-0000-0000-000000000000' && profA.business_id !== profB?.business_id);
  const pend = await app('GET', '/api/dashboard/reservations', { token: sA.token });
  check('Dashboard firme na čekanju je odbijen (403 pending)', '403/pending', pend.status + '/' + pend.json?.code, pend.status === 403 && pend.json?.code === 'pending');
  const noTok = await app('GET', '/api/dashboard/reservations');
  eq('Dashboard bez tokena (401)', 401, noTok.status);

  // Aktivacija (simulira odobrenje administratora) i usluge – direktno u TEST bazi preko service role.
  await rest('PATCH', 'businesses?id=in.(' + bizA.id + ',' + bizB.id + ')', { body: { status: 'active', is_active: true } });
  const svcA = (await rest('POST', 'services', { body: { user_id: sA.id, business_id: bizA.id, name: 'Usluga A', duration: '60 min', price: 20, price_on_request: false } })).json?.[0];
  const svcB = (await rest('POST', 'services', { body: { user_id: sB.id, business_id: bizB.id, name: 'Usluga B', duration: '60 min', price: 30, price_on_request: false } })).json?.[0];
  const dashA = await app('GET', '/api/dashboard/reservations', { token: sA.token });
  eq('Dashboard aktivne firme A radi (200)', 200, dashA.status);
  const prof = await app('GET', '/api/business-profile?slug=' + bizA.slug);
  eq('Javni profil aktivne firme A (200) sadrži samo njene usluge', '200/1', prof.status + '/' + (prof.json?.services?.length));

  await signUpDirect(emailC1, pw); await signUpDirect(emailC2, pw);
  const c1 = await signIn(emailC1, pw), c2 = await signIn(emailC2, pw);
  eq('Prijava klijenata (200/200)', '200/200', c1.status + '/' + c2.status);

  const book = (who, biz, svc, when, extra = {}) => app('POST', '/api/narudzbe', { token: who.token, body: { business_slug: biz.slug, service_id: svc.id, reservation_date: when, customer_name: 'Klijent', customer_phone: '061', ...extra } });

  // ===== 2. Rezervacije i duple rezervacije =====
  const T1 = slot(3, 10, 0);
  const b1 = await book(c1, bizA, svcA, T1); eq('C1 rezerviše termin kod A (200)', 200, b1.status);
  const r1 = b1.json?.data?.[0]; eq('Nova rezervacija je zahtjev (Na cekanju)', 'Na cekanju', r1?.status);
  eq('C2 isti termin: odbijeno (409)', 409, (await book(c2, bizA, svcA, T1)).status);
  eq('C2 preklapanje +30 min: odbijeno (409)', 409, (await book(c2, bizA, svcA, slot(3, 10, 30))).status);
  const b4 = await book(c2, bizA, svcA, slot(3, 11, 0)); eq('C2 susjedni termin odmah poslije (200)', 200, b4.status);
  eq('Termin u prošlosti odbijen (400)', 400, (await book(c2, bizA, svcA, wall(-180))).status);
  eq('Rezervacija bez prijave (401)', 401, (await app('POST', '/api/narudzbe', { body: { business_slug: bizA.slug, service_id: svcA.id, reservation_date: slot(5) } })).status);
  eq('Isto vrijeme kod DRUGE firme je slobodno (200)', 200, (await book(c2, bizB, svcB, T1)).status);
  const crossSvc = await book(c1, bizA, svcB, slot(6, 10)); eq('Usluga firme B se ne može rezervisati kod firme A (400)', 400, crossSvc.status);

  // ===== 3. Izolacija podataka između firmi =====
  const listA = (await app('GET', '/api/dashboard/reservations', { token: sA.token })).json?.reservations || [];
  check('Firma A vidi samo svoje rezervacije', 'sve business_id = A', listA.length + ' redova', listA.length >= 2 && listA.every((r) => r.business_id === bizA.id));
  const listB = (await app('GET', '/api/dashboard/reservations', { token: sB.token })).json?.reservations || [];
  check('Firma B vidi samo svoje rezervacije', 'sve business_id = B', listB.length + ' redova', listB.length >= 1 && listB.every((r) => r.business_id === bizB.id));
  const bRes = listB[0];
  const steal = await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: bRes.id, action: 'cancel' } });
  eq('A ne može mijenjati rezervaciju firme B (404)', 404, steal.status);
  eq('Rezervacija B je ostala netaknuta', bRes.status, (await getRes(bRes.id))?.status);
  const hijack = await rest('PATCH', 'profiles?id=eq.' + sA.id, { key: ANON, token: sA.token, body: { business_id: bizB.id } });
  const profAfter = (await rest('GET', 'profiles?id=eq.' + sA.id + '&select=business_id')).json?.[0];
  check('A ne može promijeniti profiles.business_id na B (REST odbijen)', 'odbijeno + nepromijenjeno', hijack.status + ' / ' + (profAfter?.business_id === bizA.id ? 'A' : 'PROMIJENJENO'), hijack.status >= 400 && profAfter?.business_id === bizA.id);
  const mkBiz = await rest('POST', 'businesses', { key: ANON, token: sA.token, body: { name: 'Hak', slug: 'hak-' + rnd, status: 'active' } });
  check('Prijavljeni korisnik ne može sam kreirati aktivnu firmu', '>=400', String(mkBiz.status), mkBiz.status >= 400);
  const anonRes = await rest('GET', 'reservations?select=id', { key: ANON });
  check('anon ključ ne čita rezervacije', '401/403 ili prazno', anonRes.status + ' / ' + JSON.stringify(anonRes.json).slice(0, 40), anonRes.status >= 400 || (Array.isArray(anonRes.json) && anonRes.json.length === 0));
  const anonDel = await rest('DELETE', 'reservations?id=eq.' + r1.id, { key: ANON });
  check('anon ključ ne briše rezervacije', 'odbijeno', String(anonDel.status), anonDel.status >= 400 || (Array.isArray(anonDel.json) && anonDel.json.length === 0));
  eq('Rezervacija C1 i dalje postoji nakon pokušaja brisanja', r1.id, (await getRes(r1.id))?.id);
  const anonBiz = await rest('GET', 'businesses?select=owner_email', { key: ANON });
  check('anon ključ ne čita firme (owner_email)', 'odbijeno ili prazno', String(anonBiz.status), anonBiz.status >= 400 || (Array.isArray(anonBiz.json) && anonBiz.json.length === 0));
  const authRes = await rest('GET', 'reservations?select=id', { key: ANON, token: sA.token });
  check('prijavljeni korisnik ne čita rezervacije direktno', 'odbijeno ili prazno', String(authRes.status), authRes.status >= 400 || (Array.isArray(authRes.json) && authRes.json.length === 0));
  const flag = await rest('PATCH', 'profiles?id=eq.' + sA.id, { key: ANON, token: sA.token, body: { must_change_password: false } });
  check('Vlastiti must_change_password je i dalje izmjenjiv', '2xx', String(flag.status), flag.status < 300);
  const cancelForeign = await app('POST', '/api/moje-rezervacije', { token: c2.token, body: { id: r1.id } });
  eq('Klijent C2 ne može otkazati tuđu rezervaciju (404)', 404, cancelForeign.status);
  const myList = (await app('GET', '/api/moje-rezervacije', { token: c1.token })).json?.data || [];
  check('Klijent vidi samo svoje termine', 'sve id = C1', myList.length + ' redova', myList.length >= 1 && myList.every((x) => x.id === r1.id));

  // ===== 4. Upravljanje: potvrda, odbijanje, preraspodjela, završetak =====
  const conf = await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: r1.id, action: 'confirm' } });
  eq('Potvrda zahtjeva (200)', 200, conf.status); eq('Status je Potvrđeno', 'Potvrđeno', (await getRes(r1.id))?.status);
  eq('Dvostruka potvrda (409)', 409, (await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: r1.id, action: 'confirm' } })).status);
  const rej = await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: b4.json.data[0].id, action: 'cancel' } });
  eq('Odbijanje zahtjeva (200)', 200, rej.status); eq('Status je Otkazano', 'Otkazano', (await getRes(b4.json.data[0].id))?.status);
  const rebook = await book(c1, bizA, svcA, slot(3, 11, 0)); eq('Nakon odbijanja termin je slobodan: nova rezervacija (200)', 200, rebook.status);
  const rb = rebook.json?.data?.[0];
  eq('Dogovor termina na zauzeto vrijeme (409)', 409, (await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: rb.id, action: 'reschedule', reservation_date: T1 } })).status);
  eq('Dogovor termina u prošlost (400)', 400, (await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: rb.id, action: 'reschedule', reservation_date: wall(-120) } })).status);
  const resch = await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: rb.id, action: 'reschedule', reservation_date: slot(4, 14, 0) } });
  eq('Dogovor termina na slobodno vrijeme (200)', 200, resch.status); eq('Status je Dogovor termina', 'Dogovor termina', (await getRes(rb.id))?.status);
  eq('Završetak (200)', 200, (await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: rb.id, action: 'complete' } })).status);
  eq('Završena se ne može otkazati od vlasnika (409)', 409, (await app('PATCH', '/api/dashboard/reservations', { token: sA.token, body: { id: rb.id, action: 'cancel' } })).status);
  eq('Završenu klijent ne može otkazati (409)', 409, (await app('POST', '/api/moje-rezervacije', { token: c1.token, body: { id: rb.id } })).status);

  // ===== 5. Pravilo otkazivanja 2 h =====
  const near = (await rest('POST', 'reservations', { body: { business_id: bizA.id, user_id: c1.id, customer_name: 'Blizu', customer_phone: '061', customer_email: emailC1, service_name: 'Usluga A', reservation_date: wall(90), duration_minutes: 60, status: 'Potvrđeno', price: '20 KM' } })).json?.[0];
  const tooLate = await app('POST', '/api/moje-rezervacije', { token: c1.token, body: { id: near.id } });
  check('Otkazivanje 90 min prije termina odbijeno (409 too-late)', '409/too-late', tooLate.status + '/' + tooLate.json?.code, tooLate.status === 409 && tooLate.json?.code === 'too-late');
  eq('Termin 90 min prije je ostao Potvrđeno', 'Potvrđeno', (await getRes(near.id))?.status);
  const ok2h = (await rest('POST', 'reservations', { body: { business_id: bizA.id, user_id: c1.id, customer_name: 'Dovoljno', customer_phone: '061', customer_email: emailC1, service_name: 'Usluga A', reservation_date: wall(130), duration_minutes: 60, status: 'Potvrđeno', price: '20 KM' } })).json?.[0];
  const okCancel = await app('POST', '/api/moje-rezervacije', { token: c1.token, body: { id: ok2h.id } });
  eq('Otkazivanje 130 min prije termina dozvoljeno (200)', 200, okCancel.status);
  eq('Status je Otkazano (red nije obrisan)', 'Otkazano', (await getRes(ok2h.id))?.status);
  eq('Ponovno otkazivanje (409)', 409, (await app('POST', '/api/moje-rezervacije', { token: c1.token, body: { id: ok2h.id } })).status);
  const cancelFar = await app('POST', '/api/moje-rezervacije', { token: c1.token, body: { id: r1.id } });
  eq('Otkazivanje potvrđenog termina za 3 dana (200)', 200, cancelFar.status);
  eq('Oslobođen termin: C2 ga može rezervisati (200)', 200, (await book(c2, bizA, svcA, T1)).status);
  const myAfter = (await app('GET', '/api/moje-rezervacije', { token: c1.token })).json?.data || [];
  check('Otkazani termini se ne prikazuju klijentu kao aktivni', '0 otkazanih', String(myAfter.filter((x) => x.status === 'Otkazano').length), myAfter.every((x) => x.status !== 'Otkazano'));

  // ===== 6. Automatsko isticanje i podsjetnici =====
  eq('Cron bez tajne (401)', 401, (await app('GET', '/api/cron/reservations')).status);
  eq('Cron s pogrešnom tajnom (401)', 401, (await app('GET', '/api/cron/reservations', { headers: { Authorization: 'Bearer pogresno' } })).status);
  const oldPending = (await rest('POST', 'reservations', { body: { business_id: bizA.id, user_id: c2.id, customer_name: 'Staro', customer_phone: '061', customer_email: emailC2, service_name: 'Usluga A', reservation_date: slot(8, 9, 0), duration_minutes: 60, status: 'Na cekanju', created_at: new Date(Date.now() - 25 * 3600000).toISOString() } })).json?.[0];
  const freshPending = (await rest('POST', 'reservations', { body: { business_id: bizA.id, user_id: c2.id, customer_name: 'Svjeze', customer_phone: '061', customer_email: emailC2, service_name: 'Usluga A', reservation_date: slot(8, 12, 0), duration_minutes: 60, status: 'Na cekanju' } })).json?.[0];
  const soon = (await rest('POST', 'reservations', { body: { business_id: bizA.id, user_id: c2.id, customer_name: 'Podsjetnik', customer_phone: '061', customer_email: emailC2, service_name: 'Usluga A', reservation_date: wall(20 * 60), duration_minutes: 60, status: 'Potvrđeno' } })).json?.[0];
  const farConf = (await rest('POST', 'reservations', { body: { business_id: bizA.id, user_id: c2.id, customer_name: 'Daleko', customer_phone: '061', customer_email: emailC2, service_name: 'Usluga A', reservation_date: slot(9, 9, 0), duration_minutes: 60, status: 'Potvrđeno' } })).json?.[0];
  const CH = { Authorization: 'Bearer ' + env.CRON_SECRET };
  const cron1 = await app('GET', '/api/cron/reservations', { headers: CH });
  eq('Cron s ispravnom tajnom (200)', 200, cron1.status);
  eq('Zahtjev stariji od 24 h je istekao', 'Isteklo', (await getRes(oldPending.id))?.status);
  eq('Svjež zahtjev nije istekao', 'Na cekanju', (await getRes(freshPending.id))?.status);
  eq('Istekli termin je slobodan: C1 ga može rezervisati (200)', 200, (await book(c1, bizA, svcA, slot(8, 9, 0))).status);
  const soonRow = await getRes(soon.id);
  const emailOn = cron1.json?.reminded > 0;
  check('Podsjetnik: potvrđeni termin u narednih 24 h je obrađen', emailOn ? 'poslan (reminder_sent_at postavljen)' : 'email isključen u Previewu: pokušaj bez oznake', emailOn ? String(soonRow?.reminder_sent_at) : 'reminderFailed=' + cron1.json?.reminderFailed, emailOn ? !!soonRow?.reminder_sent_at : cron1.json?.reminderFailed >= 1 && !soonRow?.reminder_sent_at);
  eq('Potvrđeni termin za 9 dana nema podsjetnik', null, (await getRes(farConf.id))?.reminder_sent_at ?? null);
  const cron2 = await app('GET', '/api/cron/reservations', { headers: CH });
  eq('Drugi cron prolaz ne ističe ništa novo', 0, cron2.json?.expired);
  if (emailOn) eq('Drugi cron prolaz ne šalje podsjetnik ponovo', 0, cron2.json?.reminded);

  // ===== Rezime =====
  const failed = results.filter((r) => !r.pass);
  console.log('\n==== REZIME: ' + (results.length - failed.length) + ' PASS / ' + failed.length + ' FAIL (od ' + results.length + ') ====');
  if (failed.length) { console.log('Neuspjele provjere:'); failed.forEach((f) => console.log(' - ' + f.name + ' | očekivano ' + f.expected + ' | dobijeno ' + f.observed)); }
  console.log('Napomena: test računi su *@example.com sa sufiksom ' + rnd + ' u TEST bazi. Produkcija nije dirana.');
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('Neočekivana greška testa:', e); process.exit(1); });
