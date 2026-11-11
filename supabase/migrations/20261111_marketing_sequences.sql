-- Marketing, faza 2: automatski nizovi mejlova (dobrodošlica za nove firme, praćenje upita sa sajta).
-- Samo nove tabele i jedna nova kolona u marketing_contacts. Postojeće tabele rezervacija se ne mijenjaju.
-- Ništa se ne šalje dok admin ne odobri niz i ne uključi slanje (marketing_settings.sending_enabled).

alter table public.marketing_contacts add column if not exists business_id uuid;
create unique index if not exists marketing_contacts_business_idx on public.marketing_contacts (business_id) where business_id is not null;

create table if not exists public.marketing_sequences (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  audience text not null check (audience in ('trial', 'lead')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.marketing_sequences(id) on delete cascade,
  position integer not null,
  delay_days integer not null check (delay_days between 0 and 365),
  enabled boolean not null default true,
  subject text not null,
  preheader text,
  heading text,
  body text not null,
  cta_label text,
  cta_url text,
  note text,
  updated_at timestamptz not null default now(),
  unique (sequence_id, position)
);

create table if not exists public.marketing_enrollments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.marketing_contacts(id) on delete cascade,
  sequence_id uuid not null references public.marketing_sequences(id) on delete cascade,
  started_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'completed', 'stopped')),
  stop_reason text,
  created_at timestamptz not null default now(),
  unique (contact_id, sequence_id)
);
create index if not exists marketing_enrollments_active_idx on public.marketing_enrollments (sequence_id) where status = 'active';

create table if not exists public.marketing_sends (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sequence', 'test')),
  contact_id uuid references public.marketing_contacts(id) on delete cascade,
  sequence_id uuid references public.marketing_sequences(id) on delete set null,
  step_id uuid references public.marketing_sequence_steps(id) on delete set null,
  to_email text not null,
  subject text not null,
  status text not null check (status in ('sending', 'sent', 'failed', 'simulated', 'skipped')),
  provider_id text,
  error text,
  created_by text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
-- Zaštita od duplog slanja: isti korak niza istom kontaktu najviše jednom.
create unique index if not exists marketing_sends_once_idx on public.marketing_sends (contact_id, step_id) where kind = 'sequence';
create index if not exists marketing_sends_created_idx on public.marketing_sends (created_at desc);
create index if not exists marketing_sends_contact_idx on public.marketing_sends (contact_id, created_at desc);

create table if not exists public.marketing_settings (
  key text primary key,
  value jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.marketing_settings (key, value) values
  ('sending_enabled', 'false'::jsonb),
  ('daily_limit', '40'::jsonb),
  ('footer_address', '"Mostar, Bosna i Hercegovina"'::jsonb)
on conflict (key) do nothing;

drop trigger if exists marketing_sequences_touch on public.marketing_sequences;
create trigger marketing_sequences_touch before update on public.marketing_sequences
  for each row execute function public.marketing_touch_updated_at();
drop trigger if exists marketing_steps_touch on public.marketing_sequence_steps;
create trigger marketing_steps_touch before update on public.marketing_sequence_steps
  for each row execute function public.marketing_touch_updated_at();

alter table public.marketing_sequences enable row level security;
alter table public.marketing_sequence_steps enable row level security;
alter table public.marketing_enrollments enable row level security;
alter table public.marketing_sends enable row level security;
alter table public.marketing_settings enable row level security;

revoke all on public.marketing_sequences, public.marketing_sequence_steps, public.marketing_enrollments,
  public.marketing_sends, public.marketing_settings from anon, authenticated;
grant select, insert, update, delete on public.marketing_sequences, public.marketing_sequence_steps,
  public.marketing_enrollments, public.marketing_sends, public.marketing_settings to service_role;
