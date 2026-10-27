# Faza 1: sigurnost baze (RLS i privilegije)

Status: **pripremljeno na testnoj grani. Ništa nije primijenjeno ni na jednom Supabase projektu.**
Produkcija se ne mijenja bez posebnog odobrenja.

## Stanje PRIJE izmjena (snimljeno iz `pg_policies`, `role_table_grants`, produkcijski projekat)

| Tabela | RLS | Politike | Dozvole za anon / authenticated |
|---|---|---|---|
| reservations | **isključen** | javno čitanje/upis/brisanje (`true`), „vlastite“ (`auth.uid() = user_id`) | sve (uklj. DELETE, TRUNCATE) |
| businesses | uključen | javno čitanje (`true`, uklj. `owner_email`, `telegram_chat_id`), insert za authenticated (`true`) | sve |
| profiles | uključen | insert/update/select vlastitog reda, bez ograničenja kolona | sve |
| services | uključen | `ALL` po `user_id` | sve |
| appointments, clients | uključen | anon INSERT `true` (+ vlastite) | sve (tabele prazne i nekorištene) |
| business_inquiries, customer_notes, google_calendar_tokens, push_subscriptions | uključen | nema (zaključano) | sve (RLS blokira) |

Posljedice:
- Anon ključ (javan u browseru) čita i briše sve rezervacije. Supabase je to i prijavio (`rls_disabled_in_public`).
- Prijavljeni korisnik može postaviti `profiles.business_id` na tuđi biznis (UUID se čita iz `businesses`);
  `utils/ownerAuth.ts` vjeruje toj koloni pa bi dobio pristup tuđem dashboardu. Može i sam kreirati
  biznis sa `status='active'` i vezati profil na njega (zaobilaženje odobrenja).

## Šta se mijenja (`supabase/migrations/20261028_rls_least_privilege.sql`)

- Browser ne dodiruje poslovne tabele. Jedini direktni pristup iz browsera u kodu (provjereno pretragom):
  `profiles` SELECT `must_change_password` (prijava) i UPDATE `must_change_password` (promjena lozinke).
  Sve ostalo ide kroz API rute (service role), koje filtriraju po `business_id` iz `getOwnerContext`.
- `reservations`: RLS uključen, 4 otvorene politike uklonjene, dozvole za anon/authenticated uklonjene.
- `businesses`, `services`, stare tabele: politike uklonjene, dozvole uklonjene.
- `profiles`: čitanje vlastitog reda; izmjena samo kolone `must_change_password` (`GRANT UPDATE (must_change_password)`).
- Registracija: `POST /api/register-business` (service role): status uvijek `pending`, profil vezan samo za biznis
  kreiran u istom zahtjevu.
- Samo `DROP POLICY IF EXISTS` i `REVOKE`/`ALTER ... ENABLE RLS`. Nema DELETE/TRUNCATE/UPDATE podataka.
- Ograničenje: `ALTER DEFAULT PRIVILEGES` važi za objekte koje kreira uloga koja pokreće migraciju (`postgres`).

## Revizija API ruta (kod, ne izvršenje)

Sve `app/api/dashboard/*` rute dobijaju `businessId` isključivo iz `getOwnerContext` (token → `profiles.business_id`
→ aktivan biznis) i svaki upit filtrira `.eq('business_id', businessId)`; PATCH rezervacije dodatno `.eq('id', id)`.
Dakle API izolacija stoji ili pada na integritetu `profiles.business_id`, a to se zaključava ovom migracijom i dokazuje
SQL testom (napad B/A ne može promijeniti kolonu). API-test s dva stvarna tokena nije moguć iz ovog okruženja
(blokiran mrežni pristup Supabase hostu, nema `node_modules`); predlaže se kao e2e korak na Vercel Preview vezanom
na TEST projekat (Faza 6).

## Test (`supabase/tests/rls_isolation.sql`)

Dva korisnika (A, B) i dva biznisa. Svaki napad ima svog „žrtvu“ red, i **stvarno stanje se provjerava kao vlasnik baze**
(red postoji, status nepromijenjen, profil i dalje pokazuje na svoj biznis, lažni zapis nije nastao), a ne samo
da upit vrati 0 redova. Uključene su pozitivne kontrole (podaci postoje; dozvoljene operacije rade: čitanje vlastitog
profila, `must_change_password`, service_role). Izlaz je lista `{t, expected, observed, pass}` + `summary`.

## Lokalna provjera (Postgres 16 u sandboxu, ne Supabase; uloge anon/authenticated/service_role i `auth.uid()` emulirani)

- Pokretanje 1 (ranjivo stanje): 15 FAIL / 8 PASS. Napadi uspijevaju (anon čita/briše/upisuje rezervacije, A i B preuzimaju
  dashboard preko `profiles.business_id`, čitanje PII, kreiranje aktivnog biznisa); kontrole PASS. Test dakle *može* detektovati ranjivost.
- Pokretanje 2 (nakon migracije): 23 PASS / 0 FAIL.
- Nakon oba pokretanja 0 tabela ostaje u bazi. Rollback skripta vraća anon SELECT na `reservations` i RLS=isključen;
  migracija se može ponovo primijeniti (idempotentna).
- Ograničenje: emulacija nije pravi Supabase (npr. PostgREST sloj, GoTrue trigger-i na `auth.users`); zato se ista dva pokretanja
  ponavljaju na TEST projektu nakon odobrenja.
- Napomena: psql izvršava naredbe zasebno; zato `build_runs.py` pakuje šemu + politike/migraciju + test u JEDAN `DO` blok
  (atomarno, uvijek poništeno). Pokretati generisane `run1_before.sql` / `run2_after.sql`, ne ručno spojene fajlove.

## Stvarni rezultati na TEST projektu `woixwqpnpqteguntgmcq` (2026-10-27)

- Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` su po JEDNA varijabla za `preview` + `production`
  (vrijednosti sensitive, nisu čitane): Preview i Production koriste isti Supabase projekat. TEST projekat nema tabela, pa ga sajt ne može koristiti.
  Posljedica: Vercel preview grane piše u produkcijsku bazu; ne testirati registraciju/upis na preview URL-u.
- Run 1 (ranjivo): 15 FAIL / 8 PASS. Run 2 (ranjive politike + migracija): 0 FAIL / 23 PASS. Oba su se poništila (0 tabela, 0 korisnika,
  0 politika, nepromijenjeni default privileges nakon svakog pokretanja).
- Otkriveno testiranjem (ispravljeno u skriptama): TEST ima strože default privileges i event trigger `ensure_rls` (automatski uključuje RLS na novim tabelama).
  Baseline zato eksplicitno daje produkcijske grantove i isključuje RLS na `reservations`. Prvi pokušaj run 1 je dao 13 FAIL jer RLS na rezervacijama nije bio isključen.
- Run 2 pozvan jednom neuspješno (`Invalid or expired requestState`, ništa se nije izvršilo; TEST provjeren čistim) i ponovljen.

## Plan izvršenja na TEST projektu (`woixwqpnpqteguntgmcq`), NIJE izvršeno

Princip: nikad ne ostaju otvorene politike u TEST bazi. Ranjivo stanje se gradi **unutar transakcije koja se uvijek
poništava** (test na kraju baca izuzetak).

0. Samo čitanje: potvrda da je projekat TEST (ime, ID različit od produkcije, 0 tabela u `public`), te
   `pg_default_acl` (da nove tabele dobijaju zadane dozvole za anon/authenticated kao produkcija).
1. **Pokretanje 1 (prije; kontrola testa):** `python3 supabase/tests/build_runs.py <dir>` pa `run1_before.sql`
   (šema + ranjive politike + test u jednom `DO` bloku). Očekivano: **FAIL** na napadima (anon čita/briše rezervacije, A i B preuzimaju
   dashboard preko `business_id`, čitaju PII, kreiraju aktivan biznis); **PASS** na kontrolama. Ako napadi PASS-uju,
   test ili baza nisu ispravni i staje se.
2. **Pokretanje 2 (poslije):** `run2_after.sql` (šema + ranjive politike + migracija + test).
   Očekivano: **sve PASS (0 FAIL)**, uključujući „MORA RADITI“ kontrole.
3. Provjera da ništa nije ostalo: 0 tabela u `public` na TEST projektu (obje transakcije poništene).
4. (Posebno odobrenje) Trajno primijeniti `baseline_schema.sql` + migraciju na TEST radi e2e probe registracije;
   tada TEST ima samo sigurno stanje.

## Povratak

- Pokretanja 1 i 2 se sama poništavaju (nema promjena za vraćanje).
- Ako se migracija trajno primijeni: `20261028_rls_least_privilege_rollback.sql` vraća politike i dozvole iz gornje tabele
  (na TEST projektu alternativno `drop table` na 10 tabela, jer sadrži samo probne podatke).
- Produkcija: prije primjene snimiti `pg_policies`, `role_table_grants` i backup; prethodno potvrditi da Vercel Production
  ima `SUPABASE_SERVICE_ROLE_KEY` (ruta `narudzbe`/`moje-rezervacije` imaju rezervu na anon ključ, koja bi nakon
  migracije prestala raditi).

## Ostaje za posebno odobrenje

- Bilo kakvo izvršavanje na TEST projektu; primjena na produkciju; „leaked password protection“ u Supabase Auth.
- Uklanjanje rezerve `SERVICE_ROLE || ANON` (Faza 2, kad RLS bude uključen).
- `app/prijava` ima tvrdo kodiranu admin e-mail adresu (`isAdmin`): za Fazu 6 (univerzalnost).
