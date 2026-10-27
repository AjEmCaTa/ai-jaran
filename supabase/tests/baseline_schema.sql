-- Osnovna šema (kolone kao na produkciji) za PRAZAN testni projekat. Samo CREATE (bez DROP/DELETE/UPDATE).
-- Ne sadrži politike ni grantove: tabele dobijaju zadane dozvole projekta (Supabase default privileges).
-- Ne kopira produkcijske podatke. Vidi docs/SECURITY_PHASE1.md za redoslijed pokretanja.
create extension if not exists "uuid-ossp";

create table public.businesses (
  id uuid primary key default uuid_generate_v4(), name text not null,
  created_at timestamptz default timezone('utc', now()), slug text, category text, city text, address text, phone text,
  owner_email text, work_start time default '08:00', work_end time default '17:00',
  work_days text[] default array['Pon','Uto','Sri','Cet','Pet','Sub'], telegram_chat_id text,
  is_active boolean default true, status text default 'active');
create table public.profiles (
  id uuid primary key, email text, name text, created_at timestamptz default now(),
  must_change_password boolean default true, business_id uuid);
create table public.reservations (
  id uuid primary key default gen_random_uuid(), user_id uuid, customer_name text not null, customer_phone text,
  service_name text not null, reservation_date text not null, status text default 'Na čekanju',
  created_at timestamptz not null default timezone('utc', now()), price text, customer_email text,
  business_id uuid, duration_minutes integer default 120);
create table public.services (
  id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, description text,
  duration text, price numeric, created_at timestamptz not null default timezone('utc', now()),
  business_id uuid, price_on_request boolean not null default false);
create table public.appointments (
  id uuid primary key default gen_random_uuid(), client_id uuid, customer_name text not null,
  customer_phone text not null, appointment_time timestamptz not null, status text default 'confirmed',
  created_at timestamptz not null default timezone('utc', now()));
create table public.clients (
  id uuid primary key default gen_random_uuid(), business_name text not null, slug text not null,
  working_hours text, services_description text, created_at timestamptz not null default timezone('utc', now()), phone text);
create table public.business_inquiries (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, name text not null, phone text not null,
  email text, service text, message text not null, status text not null default 'new', created_at timestamptz not null default now());
create table public.customer_notes (
  id uuid primary key default gen_random_uuid(), business_id text not null, customer_key text not null,
  note text not null default '', updated_at timestamptz not null default now());
create table public.google_calendar_tokens (
  id bigint generated always as identity primary key, created_at timestamptz not null default now(),
  user_id uuid, access_token text, refesh_token text);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, user_id uuid not null,
  endpoint text not null, p256dh text not null, auth text not null, user_agent text,
  created_at timestamptz not null default now());

-- RLS kao na produkciji: reservations ISKLJUČEN, ostale uključene
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.clients enable row level security;
alter table public.business_inquiries enable row level security;
alter table public.customer_notes enable row level security;
alter table public.google_calendar_tokens enable row level security;
alter table public.push_subscriptions enable row level security;
