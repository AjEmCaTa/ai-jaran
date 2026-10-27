-- PRODUKCIJA, PISANJE. Jedna naredba (DO blok): preflight + migracija 20261028_rls_least_privilege.sql + završne provjere.
-- Ako bilo koja provjera padne, izuzetak poništava SVE (nema djelimične primjene). Ne dira podatke.
-- GENERISANO: python3 build_release.py; ne uređivati ručno.
do $$
declare bad text;
begin
  set local lock_timeout = '5s';
  set local statement_timeout = '60s';
  select string_agg(t, ', ') into bad from unnest(array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']) t where to_regclass('public.' || t) is null;
  if bad is not null then raise exception 'Preflight: nedostaju tabele: %', bad; end if;

-- POSLO ONE: najmanje potrebne privilegije i RLS (FAZA 1).
-- NIJE primijenjeno ni na jednom projektu. Prvo se pokreće na TESTNOM Supabase projektu.
-- Ponovljivo (idempotentno). Povratak: 20261028_rls_least_privilege_rollback.sql
--
-- Model: browser (anon/authenticated ključ) ne dodiruje poslovne tabele direktno.
-- Sve poslovne operacije idu kroz serverske rute sa service role ključem (zaobilazi RLS)
-- i uvijek filtriraju po business_id iz provjerenog tokena.
-- Jedini direktni pristup iz browsera koji ostaje:
--   * profiles: SELECT vlastitog reda + UPDATE samo kolone must_change_password (promjena lozinke).

-- ---------- reservations ----------
alter table public.reservations enable row level security;
drop policy if exists "Korisnici mogu upravljati svojim rezervacijama" on public.reservations;
drop policy if exists "Omogući javni upis" on public.reservations;
drop policy if exists "Omogući javno brisanje" on public.reservations;
drop policy if exists "Omogući javno čitanje" on public.reservations;
revoke all on public.reservations from anon, authenticated;

-- ---------- businesses (owner_email i telegram_chat_id više nisu javni) ----------
drop policy if exists "Allow authenticated users to insert businesses" on public.businesses;
drop policy if exists "Allow authenticated users to read all businesses" on public.businesses;
drop policy if exists "Allow public read access to businesses" on public.businesses;
revoke all on public.businesses from anon, authenticated;
-- Javne podatke (naziv, radno vrijeme, usluge) vraća /api/business-profile (service role).
-- Registracija ide kroz /api/register-business (service role, status uvijek 'pending').

-- ---------- profiles (business_id i email se NE smiju mijenjati iz browsera) ----------
drop policy if exists "Allow authenticated users to insert own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
revoke all on public.profiles from anon, authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own_flag" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

grant select on public.profiles to authenticated;
-- Samo ova kolona je izmjenjiva (promijeni-lozinku); business_id/email/name/id nisu.
grant update (must_change_password) on public.profiles to authenticated;

-- ---------- services (piše se samo preko /api/dashboard/services) ----------
drop policy if exists "Korisnici mogu upravljati svojim uslugama" on public.services;
revoke all on public.services from anon, authenticated;

-- ---------- stare, nekorištene tabele (kod ih ne koristi) ----------
drop policy if exists "Dozvoli insert za sve" on public.appointments;
drop policy if exists "Dozvoli insert za sve" on public.clients;
drop policy if exists "Users can delete own appointments" on public.appointments;
drop policy if exists "Users can insert own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
drop policy if exists "Users can view own appointments" on public.appointments;
revoke all on public.appointments from anon, authenticated;
revoke all on public.clients from anon, authenticated;

-- ---------- tabele koje već imaju RLS bez politika: skini i suvišne grantove ----------
revoke all on public.business_inquiries from anon, authenticated;
revoke all on public.customer_notes from anon, authenticated;
revoke all on public.google_calendar_tokens from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;

-- ---------- buduće tabele ne dobijaju automatski široke dozvole ----------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;


  select string_agg(t || ':' || r, ', ') into bad from unnest(array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']) t, unnest(array['anon','authenticated']) r
   where has_table_privilege(r, 'public.' || t, 'select,insert,update,delete,truncate,references,trigger')
     and not (t = 'profiles' and r = 'authenticated');
  if bad is not null then raise exception 'Provjera: preostale dozvole: %', bad; end if;
  if has_table_privilege('authenticated', 'public.profiles', 'insert,update,delete,truncate') then raise exception 'Provjera: authenticated smije pisati u profiles (tabela)'; end if;
  if has_column_privilege('authenticated', 'public.profiles', 'business_id', 'update') then raise exception 'Provjera: business_id je izmjenjiv'; end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'must_change_password', 'update') then raise exception 'Provjera: must_change_password nije izmjenjiv'; end if;
  select string_agg(c.relname, ', ') into bad from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = any(array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']) and not c.relrowsecurity;
  if bad is not null then raise exception 'Provjera: RLS nije uključen na: %', bad; end if;
  select string_agg(tablename || '.' || policyname, ', ') into bad from pg_policies
   where schemaname = 'public' and not (tablename = 'profiles' and policyname in ('profiles_select_own', 'profiles_update_own_flag'));
  if bad is not null then raise exception 'Provjera: preostale politike: %', bad; end if;
  if not has_table_privilege('service_role', 'public.reservations', 'select,insert,update,delete') then raise exception 'Provjera: service_role izgubio pristup'; end if;

  raise notice 'OK: 03_migrate.sql primijenjen i provjeren.';
end $$;
