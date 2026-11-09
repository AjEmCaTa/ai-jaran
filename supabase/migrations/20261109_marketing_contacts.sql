-- Marketing, faza 1: kontakti, uvozi i evidencija aktivnosti.
-- Potpuno odvojeno od rezervacija: nove tabele, bez stranih ključeva prema postojećim tabelama,
-- bez izmjena postojećih tabela. Pristup samo sa servera (service role); anon/authenticated nemaju ništa.

create table if not exists public.marketing_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  legal_basis text not null,
  source text,
  total_rows integer not null default 0,
  inserted integer not null default 0,
  duplicates integer not null default 0,
  invalid integer not null default 0,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_name text,
  owner_name text,
  category text,
  city text,
  phone text,
  website text,
  notes text,
  tags text[] not null default '{}',
  -- consent = izričit pristanak, customer = postojeći korisnik, inquiry = sam poslao upit, cold = hladni kontakt (bez slanja)
  legal_basis text not null,
  consent_source text,
  consent_at timestamptz,
  status text not null default 'active',
  unsubscribe_token uuid not null default gen_random_uuid(),
  import_id uuid references public.marketing_imports(id) on delete set null,
  last_contacted_at timestamptz,
  replied_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_contacts_email_lower check (email = lower(btrim(email))),
  constraint marketing_contacts_email_format check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint marketing_contacts_legal_basis check (legal_basis in ('consent', 'customer', 'inquiry', 'cold')),
  constraint marketing_contacts_status check (status in ('active', 'unsubscribed', 'bounced', 'complained')),
  constraint marketing_contacts_consent_date check (legal_basis <> 'consent' or consent_at is not null),
  constraint marketing_contacts_email_unique unique (email),
  constraint marketing_contacts_token_unique unique (unsubscribe_token)
);

create index if not exists marketing_contacts_status_idx on public.marketing_contacts (status);
create index if not exists marketing_contacts_basis_idx on public.marketing_contacts (legal_basis);
create index if not exists marketing_contacts_category_idx on public.marketing_contacts (category);
create index if not exists marketing_contacts_city_idx on public.marketing_contacts (city);
create index if not exists marketing_contacts_created_idx on public.marketing_contacts (created_at desc);

create table if not exists public.marketing_activity_log (
  id bigint generated always as identity primary key,
  actor text not null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists marketing_activity_log_created_idx on public.marketing_activity_log (created_at desc);

-- Kontakt kome se smije slati marketing: aktivan i nije hladni kontakt.
create or replace function public.marketing_contact_sendable(c public.marketing_contacts)
returns boolean language sql immutable set search_path = public as $$
  select c.status = 'active' and c.legal_basis in ('consent', 'customer', 'inquiry');
$$;

create or replace function public.marketing_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists marketing_contacts_touch on public.marketing_contacts;
create trigger marketing_contacts_touch before update on public.marketing_contacts
  for each row execute function public.marketing_touch_updated_at();

alter table public.marketing_imports enable row level security;
alter table public.marketing_contacts enable row level security;
alter table public.marketing_activity_log enable row level security;

revoke all on public.marketing_imports from anon, authenticated;
revoke all on public.marketing_contacts from anon, authenticated;
revoke all on public.marketing_activity_log from anon, authenticated;
revoke all on function public.marketing_contact_sendable(public.marketing_contacts) from public, anon, authenticated;
revoke all on function public.marketing_touch_updated_at() from public, anon, authenticated;
