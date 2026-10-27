-- PRODUKCIJA, PISANJE. Povratak na stanje prije migracije (ponovo OTVARA ranjivost: koristiti samo ako migracija zaustavi aplikaciju
-- i ako se ne može popraviti ciljanim grantom). Jedna naredba, atomarno. GENERISANO: python3 build_release.py.
do $$
declare bad text;
begin
  set local lock_timeout = '5s';
  set local statement_timeout = '60s';
  select string_agg(t, ', ') into bad from unnest(array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']) t where to_regclass('public.' || t) is null;
  if bad is not null then raise exception 'Preflight: nedostaju tabele: %', bad; end if;

-- POVRATAK na stanje prije 20261028_rls_least_privilege.sql
-- (stanje snimljeno 2026-10-27 iz pg_policies i role_table_grants; vidi docs/SECURITY_PHASE1.md).
-- Vraća ISTE (nesigurne) postavke: koristiti samo ako nova pravila zaustave aplikaciju.

-- reservations: RLS je bio ISKLJUČEN, politike su postojale
alter table public.reservations disable row level security;
drop policy if exists "Korisnici mogu upravljati svojim rezervacijama" on public.reservations;
create policy "Korisnici mogu upravljati svojim rezervacijama" on public.reservations for all to public using (auth.uid() = user_id);
drop policy if exists "Omogući javni upis" on public.reservations;
create policy "Omogući javni upis" on public.reservations for insert to public with check (true);
drop policy if exists "Omogući javno brisanje" on public.reservations;
create policy "Omogući javno brisanje" on public.reservations for delete to public using (true);
drop policy if exists "Omogući javno čitanje" on public.reservations;
create policy "Omogući javno čitanje" on public.reservations for select to public using (true);

-- businesses
drop policy if exists "Allow authenticated users to insert businesses" on public.businesses;
create policy "Allow authenticated users to insert businesses" on public.businesses for insert to authenticated with check (true);
drop policy if exists "Allow authenticated users to read all businesses" on public.businesses;
create policy "Allow authenticated users to read all businesses" on public.businesses for select to authenticated using (true);
drop policy if exists "Allow public read access to businesses" on public.businesses;
create policy "Allow public read access to businesses" on public.businesses for select to anon, authenticated using (true);

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own_flag" on public.profiles;
drop policy if exists "Allow authenticated users to insert own profile" on public.profiles;
create policy "Allow authenticated users to insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to public with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to public using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to public using (auth.uid() = id);

-- services
drop policy if exists "Korisnici mogu upravljati svojim uslugama" on public.services;
create policy "Korisnici mogu upravljati svojim uslugama" on public.services for all to public using (auth.uid() = user_id);

-- appointments / clients
drop policy if exists "Dozvoli insert za sve" on public.appointments;
create policy "Dozvoli insert za sve" on public.appointments for insert to anon with check (true);
drop policy if exists "Dozvoli insert za sve" on public.clients;
create policy "Dozvoli insert za sve" on public.clients for insert to anon with check (true);
drop policy if exists "Users can delete own appointments" on public.appointments;
create policy "Users can delete own appointments" on public.appointments for delete to public using (auth.uid() = client_id);
drop policy if exists "Users can insert own appointments" on public.appointments;
create policy "Users can insert own appointments" on public.appointments for insert to public with check (auth.uid() = client_id);
drop policy if exists "Users can update own appointments" on public.appointments;
create policy "Users can update own appointments" on public.appointments for update to public using (auth.uid() = client_id) with check (auth.uid() = client_id);
drop policy if exists "Users can view own appointments" on public.appointments;
create policy "Users can view own appointments" on public.appointments for select to public using (auth.uid() = client_id);

-- grantovi: prije su anon i authenticated imali SVE na ovim tabelama
grant all on public.reservations, public.businesses, public.profiles, public.services,
  public.appointments, public.clients, public.business_inquiries, public.customer_notes,
  public.google_calendar_tokens, public.push_subscriptions to anon, authenticated;

alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;


  if not (select not relrowsecurity from pg_class where oid = 'public.reservations'::regclass) then raise exception 'Rollback provjera: reservations RLS i dalje uključen'; end if;
  if not has_table_privilege('anon', 'public.reservations', 'select') then raise exception 'Rollback provjera: anon nema SELECT na reservations'; end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'business_id', 'update') then raise exception 'Rollback provjera: business_id nije vraćen'; end if;

  raise notice 'OK: 05_rollback.sql primijenjen i provjeren.';
end $$;
