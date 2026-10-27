#!/usr/bin/env python3
"""Generiše 03_migrate.sql i 05_rollback.sql: migracija/rollback + preflight + završne provjere u JEDNOM DO bloku
(jedna naredba, atomarno: ako bilo šta pogrešno, ništa se ne primijeni, bez obzira kako klijent šalje upit)."""
import pathlib
here = pathlib.Path(__file__).parent
mig = here.parent / "migrations"
TABLES = "array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']"
pre = f"""
  set local lock_timeout = '5s';
  set local statement_timeout = '60s';
  select string_agg(t, ', ') into bad from unnest({TABLES}) t where to_regclass('public.' || t) is null;
  if bad is not null then raise exception 'Preflight: nedostaju tabele: %', bad; end if;
"""
post_migrate = f"""
  select string_agg(t || ':' || r, ', ') into bad from unnest({TABLES}) t, unnest(array['anon','authenticated']) r
   where has_table_privilege(r, 'public.' || t, 'select,insert,update,delete,truncate,references,trigger')
     and not (t = 'profiles' and r = 'authenticated');
  if bad is not null then raise exception 'Provjera: preostale dozvole: %', bad; end if;
  if has_table_privilege('authenticated', 'public.profiles', 'insert,update,delete,truncate') then raise exception 'Provjera: authenticated smije pisati u profiles (tabela)'; end if;
  if has_column_privilege('authenticated', 'public.profiles', 'business_id', 'update') then raise exception 'Provjera: business_id je izmjenjiv'; end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'must_change_password', 'update') then raise exception 'Provjera: must_change_password nije izmjenjiv'; end if;
  select string_agg(c.relname, ', ') into bad from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = any({TABLES}) and not c.relrowsecurity;
  if bad is not null then raise exception 'Provjera: RLS nije uključen na: %', bad; end if;
  select string_agg(tablename || '.' || policyname, ', ') into bad from pg_policies
   where schemaname = 'public' and not (tablename = 'profiles' and policyname in ('profiles_select_own', 'profiles_update_own_flag'));
  if bad is not null then raise exception 'Provjera: preostale politike: %', bad; end if;
  if not has_table_privilege('service_role', 'public.reservations', 'select,insert,update,delete') then raise exception 'Provjera: service_role izgubio pristup'; end if;
"""
post_rollback = """
  if not (select not relrowsecurity from pg_class where oid = 'public.reservations'::regclass) then raise exception 'Rollback provjera: reservations RLS i dalje uključen'; end if;
  if not has_table_privilege('anon', 'public.reservations', 'select') then raise exception 'Rollback provjera: anon nema SELECT na reservations'; end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'business_id', 'update') then raise exception 'Rollback provjera: business_id nije vraćen'; end if;
"""
def build(name, header, body_file, post):
    body = (mig / body_file).read_text(encoding="utf-8")
    assert "$$" not in body
    out = f"{header}\ndo $$\ndeclare bad text;\nbegin{pre}\n{body}\n{post}\n  raise notice 'OK: {name} primijenjen i provjeren.';\nend $$;\n"
    (here / name).write_text(out, encoding="utf-8")
build("03_migrate.sql",
      "-- PRODUKCIJA, PISANJE. Jedna naredba (DO blok): preflight + migracija 20261028_rls_least_privilege.sql + završne provjere.\n-- Ako bilo koja provjera padne, izuzetak poništava SVE (nema djelimične primjene). Ne dira podatke.\n-- GENERISANO: python3 build_release.py; ne uređivati ručno.",
      "20261028_rls_least_privilege.sql", post_migrate)
build("05_rollback.sql",
      "-- PRODUKCIJA, PISANJE. Povratak na stanje prije migracije (ponovo OTVARA ranjivost: koristiti samo ako migracija zaustavi aplikaciju\n-- i ako se ne može popraviti ciljanim grantom). Jedna naredba, atomarno. GENERISANO: python3 build_release.py.",
      "20261028_rls_least_privilege_rollback.sql", post_rollback)
print("OK")
