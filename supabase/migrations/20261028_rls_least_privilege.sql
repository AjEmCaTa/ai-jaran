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
