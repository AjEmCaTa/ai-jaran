#!/usr/bin/env python3
"""Generiše test_project_setup.sql: TRAJNA šema za TEST projekat u sigurnom krajnjem stanju.
Jedan DO blok (atomarno): tabele + ograničenja + (privremeni produkcijski grantovi) + migracija 20261028 + završne provjere.
NIKADA se ne pokreće na produkciji (tabele već postoje; ovo je za PRAZAN test projekat; ima zaštitu: staje ako public već ima tabele).
Upotreba: python3 build_test_project_setup.py <izlazni_direktorij>"""
import pathlib, sys
here = pathlib.Path(__file__).parent
mig = here.parent / "migrations" / "20261028_rls_least_privilege.sql"
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
r = lambda p: p.read_text(encoding="utf-8")
setup = r(here / "baseline_schema.sql") + "\n" + r(here / "baseline_constraints.sql") + "\n" + r(mig)
assert "$$" not in setup
TABLES = "array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']"
sql = f"""-- TEST PROJEKAT, PISANJE (trajno). Samo za projekat 'POSLO ONE TEST' (woixwqpnpqteguntgmcq). Jedna naredba (DO blok), atomarno.
-- Staje ako je ovo ikako baza koja već ima tabele u public (zaštita da se ne pokrene na produkciji).
-- GENERISANO: python3 build_test_project_setup.py; ne uređivati ručno.
do $$
declare bad text; n int;
begin
  select count(*) into n from information_schema.tables where table_schema = 'public';
  if n <> 0 then raise exception 'ZAUSTAVLJENO: public šema već ima % tabela; ovo je skripta za PRAZAN test projekat.', n; end if;
  set local lock_timeout = '5s';
{setup}
  select string_agg(t || ':' || r, ', ') into bad from unnest({TABLES}) t, unnest(array['anon','authenticated']) r
   where has_table_privilege(r, 'public.' || t, 'select,insert,update,delete,truncate,references,trigger') and not (t = 'profiles' and r = 'authenticated');
  if bad is not null then raise exception 'Provjera: preostale dozvole: %', bad; end if;
  if has_column_privilege('authenticated', 'public.profiles', 'business_id', 'update') then raise exception 'Provjera: business_id izmjenjiv'; end if;
  select string_agg(c.relname, ', ') into bad from pg_class c join pg_namespace x on x.oid = c.relnamespace
   where x.nspname = 'public' and c.relname = any({TABLES}) and not c.relrowsecurity;
  if bad is not null then raise exception 'Provjera: RLS nije uključen: %', bad; end if;
  if not has_table_privilege('service_role', 'public.reservations', 'select,insert,update,delete') then raise exception 'Provjera: service_role bez pristupa'; end if;
  raise notice 'OK: TEST projekat postavljen u sigurno stanje.';
end $$;
"""
(out / "test_project_setup.sql").write_text(sql, encoding="utf-8")
print("OK", out / "test_project_setup.sql")
