-- PRODUKCIJA, PISANJE (samo NOVI objekti, ništa postojeće se ne mijenja). Dopuna, NE zamjena za vanjski backup (pg_dump).
-- Schema 'backup_20261028' nije izložena API-ju (PostgREST izlaže samo public), a pristup se i eksplicitno oduzima.
-- Sadrži kopije podataka i snimak politika/grantova za usporedbu i povrat. google_calendar_tokens sadrži tajne: pristup samo vlasnik baze.
create schema backup_20261028;
revoke all on schema backup_20261028 from public, anon, authenticated;
create table backup_20261028.reservations as table public.reservations;
create table backup_20261028.businesses as table public.businesses;
create table backup_20261028.profiles as table public.profiles;
create table backup_20261028.services as table public.services;
create table backup_20261028.business_inquiries as table public.business_inquiries;
create table backup_20261028.customer_notes as table public.customer_notes;
create table backup_20261028.push_subscriptions as table public.push_subscriptions;
create table backup_20261028.google_calendar_tokens as table public.google_calendar_tokens;
create table backup_20261028.pg_policies_snapshot as select * from pg_policies where schemaname='public';
create table backup_20261028.table_grants_snapshot as select * from information_schema.role_table_grants where table_schema='public';
create table backup_20261028.rls_flags_snapshot as
  select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';
revoke all on all tables in schema backup_20261028 from public, anon, authenticated;
-- Provjera: brojevi redova kopija moraju biti jednaki izvorima
select 'reservations' t, (select count(*) from public.reservations) src, (select count(*) from backup_20261028.reservations) bak
union all select 'businesses', (select count(*) from public.businesses), (select count(*) from backup_20261028.businesses)
union all select 'profiles', (select count(*) from public.profiles), (select count(*) from backup_20261028.profiles)
union all select 'services', (select count(*) from public.services), (select count(*) from backup_20261028.services);
