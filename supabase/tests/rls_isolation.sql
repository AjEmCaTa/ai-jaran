-- Test izolacije biznisa: dva nezavisna korisnika (A, B) i dva biznisa.
-- SAMO ZA TESTNI PROJEKAT. Ništa se ne čuva: skripta na kraju baca izuzetak
-- 'RLS_TEST_RESULT: {...}' pa se sve poništava (uključujući privremene korisnike i podatke).
--
-- Princip: napad se NE smatra neuspjelim samo zato što upit ne vrati redove.
-- Za svaki napad (1) uzima se opaženi ishod pod ulogom anon/authenticated, a zatim
-- (2) kao vlasnik baze se PROVJERAVA stvarno stanje podataka (da li je red ostao
-- netaknut, da li profil i dalje pokazuje na svoj biznis, da li je lažni zapis nastao).
-- Pored toga postoje "pozitivne kontrole": podaci stvarno postoje (vlasnik baze ih vidi)
-- i dozvoljene operacije stvarno rade (inače bi "0 redova" mogao značiti pogrešan test).
-- Svaki napad koristi SVOJ red-žrtvu, da jedan napad ne poništi pretpostavke drugog.
--
-- Oznaka SETUP (komentar u DO bloku) popunjava build_runs.py šemom/politikama/migracijom, tako da je SVE jedna
-- naredba (jedan DO blok): atomarno i uvijek poništeno, bez obzira kako klijent šalje upit.
-- Rezultat: lista {t, expected, observed, pass} + summary {pass, fail}.
-- Pred-migracija se očekuje FAIL na napadima (potvrda ranjivosti), poslije migracije svi PASS.

create or replace function pg_temp.rec(res jsonb, t text, expected text, observed text, ok boolean)
returns jsonb language sql as $$
  select res || jsonb_build_array(jsonb_build_object('t', t, 'expected', expected, 'observed', observed, 'pass', ok));
$$;

do $$
declare
  ua uuid := gen_random_uuid();  -- korisnik/vlasnik biznisa A
  ub uuid := gen_random_uuid();  -- korisnik/vlasnik biznisa B
  ba uuid; bb uuid;
  ra uuid;                                   -- rezervacija biznisa A
  rb_read uuid; rb_anon_del uuid; rb_a_upd uuid; rb_a_del uuid; rb_b_upd uuid;  -- žrtve biznisa B (i A za B-napade)
  res jsonb := '[]'::jsonb;
  o jsonb := '{}'::jsonb;                    -- opažanja pod ograničenom ulogom
  n int; s text; v uuid; v2 boolean;
  obs text;
begin
  -- @@SETUP@@
  -- ===== PRIPREMA (kao vlasnik baze) =====
  insert into auth.users (id, instance_id, aud, role, email)
  values (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.invalid'),
         (ub, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.invalid');

  insert into public.businesses (name, slug, owner_email, telegram_chat_id, status)
  values ('RLS Test A', 'rls-test-a-' || substr(ua::text, 1, 6), 'owner-a@example.invalid', 'tg-secret-a', 'active') returning id into ba;
  insert into public.businesses (name, slug, owner_email, telegram_chat_id, status)
  values ('RLS Test B', 'rls-test-b-' || substr(ub::text, 1, 6), 'owner-b@example.invalid', 'tg-secret-b', 'active') returning id into bb;

  insert into public.profiles (id, email, name, business_id, must_change_password)
  values (ua, 'rls-a@example.invalid', 'Vlasnik A', ba, true), (ub, 'rls-b@example.invalid', 'Vlasnik B', bb, true)
  on conflict (id) do update set business_id = excluded.business_id, must_change_password = true,
                                 email = excluded.email, name = excluded.name;

  insert into public.reservations (user_id, business_id, customer_name, customer_phone, service_name, reservation_date, status)
  values (ua, ba, 'Klijent A', '061000001', 'Usluga A', '2030-01-01T10:00', 'Na čekanju') returning id into ra;
  insert into public.reservations (user_id, business_id, customer_name, customer_phone, service_name, reservation_date, status)
  values (ub, bb, 'Klijent B1', '061000002', 'Usluga B', '2030-01-01T11:00', 'Na čekanju') returning id into rb_read;
  insert into public.reservations (user_id, business_id, customer_name, customer_phone, service_name, reservation_date, status)
  values (ub, bb, 'Klijent B2', '061000003', 'Usluga B', '2030-01-01T12:00', 'Na čekanju') returning id into rb_anon_del;
  insert into public.reservations (user_id, business_id, customer_name, customer_phone, service_name, reservation_date, status)
  values (ub, bb, 'Klijent B3', '061000004', 'Usluga B', '2030-01-01T13:00', 'Na čekanju') returning id into rb_a_upd;
  insert into public.reservations (user_id, business_id, customer_name, customer_phone, service_name, reservation_date, status)
  values (ub, bb, 'Klijent B4', '061000005', 'Usluga B', '2030-01-01T14:00', 'Na čekanju') returning id into rb_a_del;
  insert into public.reservations (user_id, business_id, customer_name, customer_phone, service_name, reservation_date, status)
  values (ua, ba, 'Klijent A2', '061000006', 'Usluga A', '2030-01-01T15:00', 'Na čekanju') returning id into rb_b_upd;

  -- Pozitivne kontrole: podaci stvarno postoje (kao vlasnik baze)
  select count(*) into n from public.reservations where business_id in (ba, bb);
  res := pg_temp.rec(res, 'KONTROLA: u bazi postoji 6 testnih rezervacija', '6', n::text, n = 6);
  select count(*) into n from public.businesses where id in (ba, bb) and owner_email is not null and telegram_chat_id is not null;
  res := pg_temp.rec(res, 'KONTROLA: dva biznisa s owner_email i telegram_chat_id', '2', n::text, n = 2);

  -- ===== ANON (javni ključ, neprijavljen) =====
  execute 'set local role anon';
  begin select count(*) into n from public.reservations; o := o || jsonb_build_object('anon_sel', n::text);
  exception when others then o := o || jsonb_build_object('anon_sel', 'denied'); end;
  begin delete from public.reservations where id = rb_anon_del; get diagnostics n = row_count; o := o || jsonb_build_object('anon_del', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('anon_del', 'denied'); end;
  begin select count(*) into n from public.businesses where owner_email is not null or telegram_chat_id is not null; o := o || jsonb_build_object('anon_pii', n::text);
  exception when others then o := o || jsonb_build_object('anon_pii', 'denied'); end;
  begin insert into public.reservations (customer_name, service_name, reservation_date, business_id) values ('ANON-INSERT', 'x', '2030-02-02T10:00', ba); o := o || jsonb_build_object('anon_ins', 'inserted');
  exception when others then o := o || jsonb_build_object('anon_ins', 'denied'); end;
  execute 'reset role';

  obs := o->>'anon_sel';
  res := pg_temp.rec(res, 'anon čita rezervacije', '0 redova ili denied', obs, obs in ('0', 'denied'));
  select count(*) into n from public.reservations where id = rb_anon_del;
  res := pg_temp.rec(res, 'anon briše tuđu rezervaciju: red mora postojati (provjereno kao vlasnik baze)', 'red postoji (1)', 'red postoji: ' || n || ' / opaženo: ' || (o->>'anon_del'), n = 1);
  obs := o->>'anon_pii';
  res := pg_temp.rec(res, 'anon čita owner_email/telegram_chat_id', '0 redova ili denied', obs, obs in ('0', 'denied'));
  select count(*) into n from public.reservations where customer_name = 'ANON-INSERT';
  res := pg_temp.rec(res, 'anon direktno upisuje rezervaciju: ne smije nastati red', '0', n::text, n = 0);

  -- ===== AUTHENTICATED: korisnik A napada biznis B =====
  o := '{}'::jsonb;
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin select count(*) into n from public.reservations where business_id = bb; o := o || jsonb_build_object('a_sel', n::text);
  exception when others then o := o || jsonb_build_object('a_sel', 'denied'); end;
  begin update public.reservations set status = 'Otkazano' where id = rb_a_upd; get diagnostics n = row_count; o := o || jsonb_build_object('a_upd', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('a_upd', 'denied'); end;
  begin delete from public.reservations where id = rb_a_del; get diagnostics n = row_count; o := o || jsonb_build_object('a_del', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('a_del', 'denied'); end;
  begin select count(*) into n from public.businesses where id = bb and (owner_email is not null or telegram_chat_id is not null); o := o || jsonb_build_object('a_pii', n::text);
  exception when others then o := o || jsonb_build_object('a_pii', 'denied'); end;
  begin insert into public.businesses (name, slug, status) values ('LAZNI-BIZNIS', 'rls-fake-' || substr(ua::text, 1, 6), 'active'); o := o || jsonb_build_object('a_biz', 'inserted');
  exception when others then o := o || jsonb_build_object('a_biz', 'denied'); end;
  begin insert into public.services (user_id, business_id, name) values (ua, bb, 'LAZNA-USLUGA'); o := o || jsonb_build_object('a_svc', 'inserted');
  exception when others then o := o || jsonb_build_object('a_svc', 'denied'); end;
  begin select count(*) into n from public.profiles where id = ub; o := o || jsonb_build_object('a_prof_other', n::text);
  exception when others then o := o || jsonb_build_object('a_prof_other', 'denied'); end;
  -- dozvoljene operacije (pozitivne kontrole pod istom ulogom)
  begin select count(*) into n from public.profiles where id = ua; o := o || jsonb_build_object('a_prof_own', n::text);
  exception when others then o := o || jsonb_build_object('a_prof_own', 'denied'); end;
  begin update public.profiles set must_change_password = false where id = ua; get diagnostics n = row_count; o := o || jsonb_build_object('a_flag', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('a_flag', 'denied'); end;
  -- NAJVAŽNIJI NAPAD: preuzimanje tuđeg dashboarda; zadnji, da ne utiče na ostale
  begin update public.profiles set business_id = bb where id = ua; get diagnostics n = row_count; o := o || jsonb_build_object('a_take', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('a_take', 'denied'); end;
  begin update public.profiles set email = 'preuzet@example.invalid', name = 'Preuzet' where id = ua; get diagnostics n = row_count; o := o || jsonb_build_object('a_edit', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('a_edit', 'denied'); end;
  execute 'reset role';

  obs := o->>'a_sel';
  res := pg_temp.rec(res, 'A čita rezervacije biznisa B', '0 redova ili denied', obs, obs in ('0', 'denied'));
  select status into s from public.reservations where id = rb_a_upd;
  res := pg_temp.rec(res, 'A mijenja rezervaciju biznisa B: status mora ostati ''Na čekanju''', 'Na čekanju', coalesce(s, 'NULL') || ' / opaženo: ' || (o->>'a_upd'), s = 'Na čekanju');
  select count(*) into n from public.reservations where id = rb_a_del;
  res := pg_temp.rec(res, 'A briše rezervaciju biznisa B: red mora postojati', 'red postoji (1)', n::text || ' / opaženo: ' || (o->>'a_del'), n = 1);
  obs := o->>'a_pii';
  res := pg_temp.rec(res, 'A čita owner_email/telegram_chat_id biznisa B', '0 redova ili denied', obs, obs in ('0', 'denied'));
  select count(*) into n from public.businesses where name = 'LAZNI-BIZNIS';
  res := pg_temp.rec(res, 'A kreira biznis (active) direktno: ne smije nastati red', '0', n::text, n = 0);
  select count(*) into n from public.services where name = 'LAZNA-USLUGA';
  res := pg_temp.rec(res, 'A dodaje uslugu u biznis B: ne smije nastati red', '0', n::text, n = 0);
  obs := o->>'a_prof_other';
  res := pg_temp.rec(res, 'A čita tuđi profil', '0 redova ili denied', obs, obs in ('0', 'denied'));
  obs := o->>'a_prof_own';
  res := pg_temp.rec(res, 'MORA RADITI: A čita vlastiti profil (prijava)', '1', obs, obs = '1');
  select must_change_password into v2 from public.profiles where id = ua;
  res := pg_temp.rec(res, 'MORA RADITI: A mijenja must_change_password (promjena lozinke)', 'false u bazi', coalesce(v2::text, 'NULL') || ' / opaženo: ' || (o->>'a_flag'), v2 = false);
  select business_id into v from public.profiles where id = ua;
  res := pg_temp.rec(res, 'KLJUČNO: A postavlja profiles.business_id na biznis B: profil mora i dalje pokazivati na A', 'business_id = biznis A',
                     case when v = ba then 'biznis A' when v = bb then 'BIZNIS B (preuzet dashboard)' else coalesce(v::text, 'NULL') end || ' / opaženo: ' || (o->>'a_take'), v = ba);
  select count(*) into n from public.profiles where id = ua and (email <> 'rls-a@example.invalid' or name <> 'Vlasnik A');
  res := pg_temp.rec(res, 'A mijenja vlastiti email/name u profilu: mora ostati isto', '0 promijenjenih', n::text || ' / opaženo: ' || (o->>'a_edit'), n = 0);

  -- ===== AUTHENTICATED: korisnik B napada biznis A (simetrija) =====
  o := '{}'::jsonb;
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin select count(*) into n from public.reservations where business_id = ba; o := o || jsonb_build_object('b_sel', n::text);
  exception when others then o := o || jsonb_build_object('b_sel', 'denied'); end;
  begin update public.reservations set status = 'Otkazano' where id = rb_b_upd; get diagnostics n = row_count; o := o || jsonb_build_object('b_upd', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('b_upd', 'denied'); end;
  begin update public.profiles set business_id = ba where id = ub; get diagnostics n = row_count; o := o || jsonb_build_object('b_take', 'rows=' || n);
  exception when others then o := o || jsonb_build_object('b_take', 'denied'); end;
  execute 'reset role';

  obs := o->>'b_sel';
  res := pg_temp.rec(res, 'B čita rezervacije biznisa A', '0 redova ili denied', obs, obs in ('0', 'denied'));
  select status into s from public.reservations where id = rb_b_upd;
  res := pg_temp.rec(res, 'B mijenja rezervaciju biznisa A: status mora ostati ''Na čekanju''', 'Na čekanju', coalesce(s, 'NULL') || ' / opaženo: ' || (o->>'b_upd'), s = 'Na čekanju');
  select business_id into v from public.profiles where id = ub;
  res := pg_temp.rec(res, 'KLJUČNO: B postavlja profiles.business_id na biznis A: profil mora ostati na B', 'business_id = biznis B',
                     case when v = bb then 'biznis B' when v = ba then 'BIZNIS A (preuzet dashboard)' else coalesce(v::text, 'NULL') end || ' / opaženo: ' || (o->>'b_take'), v = bb);

  -- ===== SERVICE ROLE (server): mora i dalje sve raditi =====
  execute 'set local role service_role';
  begin
    select count(*) into n from public.reservations where id in (ra, rb_b_upd); o := o || jsonb_build_object('s_sel', n::text);
    update public.reservations set status = 'Potvrđeno' where id = ra and business_id = ba; get diagnostics n = row_count; o := o || jsonb_build_object('s_upd', 'rows=' || n);
    insert into public.businesses (name, slug, owner_email, status) values ('SR Test', 'rls-sr-' || substr(ua::text, 1, 6), 'sr@example.invalid', 'pending');
    o := o || jsonb_build_object('s_biz', 'inserted');
  exception when others then o := o || jsonb_build_object('s_err', sqlerrm); end;
  execute 'reset role';
  res := pg_temp.rec(res, 'MORA RADITI: service_role čita rezervacije biznisa A', '2 (ra + rb_b_upd)', coalesce(o->>'s_sel', o->>'s_err'), (o->>'s_sel') = '2');
  select status into s from public.reservations where id = ra;
  res := pg_temp.rec(res, 'MORA RADITI: service_role mijenja rezervaciju (registruje se u bazi)', 'Potvrđeno', coalesce(s, 'NULL'), s = 'Potvrđeno');
  res := pg_temp.rec(res, 'MORA RADITI: service_role upisuje biznis (registracija)', 'inserted', coalesce(o->>'s_biz', o->>'s_err'), (o->>'s_biz') = 'inserted');

  -- ===== rezultat; izuzetak poništava sve =====
  raise exception 'RLS_TEST_RESULT: %', jsonb_build_object(
    'summary', jsonb_build_object('pass', (select count(*) from jsonb_array_elements(res) e where (e->>'pass')::boolean),
                                  'fail', (select count(*) from jsonb_array_elements(res) e where not (e->>'pass')::boolean)),
    'checks', res)::text;
end $$;
