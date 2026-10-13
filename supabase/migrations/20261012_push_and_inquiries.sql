-- POSLO ONE: upiti (business_inquiries) i web push pretplate (push_subscriptions).
-- NIJE primijenjeno automatski. Ponovljivo (idempotentno), ne mijenja ni ne briše postojeće podatke.
-- Ne dira businesses, profiles, services, reservations (osim opcionalnog indeksa na kraju).
-- Pokrenuti prvo na TESTNOM Supabase projektu.

do $$
declare
  biz_id_type text;
begin
  -- Tip FK kolone preuzima se iz stvarne tabele (u repozitoriju nema šeme, pa se ne pretpostavlja uuid).
  select format_type(a.atttypid, a.atttypmod) into biz_id_type
  from pg_attribute a
  where a.attrelid = 'public.businesses'::regclass and a.attname = 'id' and not a.attisdropped;

  if biz_id_type is null then
    raise exception 'public.businesses.id nije pronađena: ovo nije ispravan POSLO ONE projekat.';
  end if;

  execute format($f$
    create table if not exists public.business_inquiries (
      id uuid primary key default gen_random_uuid(),
      business_id %s not null references public.businesses(id) on delete cascade,
      name text not null,
      phone text not null,
      email text,
      service text,
      message text not null,
      status text not null default 'new' check (status in ('new', 'handled')),
      created_at timestamptz not null default now()
    )$f$, biz_id_type);

  execute format($f$
    create table if not exists public.push_subscriptions (
      id uuid primary key default gen_random_uuid(),
      business_id %s not null references public.businesses(id) on delete cascade,
      user_id uuid not null,
      endpoint text not null,
      p256dh text not null,
      auth text not null,
      user_agent text,
      created_at timestamptz not null default now()
    )$f$, biz_id_type);
end $$;

create index if not exists business_inquiries_business_created_idx
  on public.business_inquiries (business_id, created_at desc);

-- Isti uređaj (endpoint) smije biti pretplaćen na više firmi: jedinstvena je kombinacija (business_id, endpoint).
-- Kod koristi upsert s onConflict 'business_id,endpoint', pa ovaj indeks je obavezan.
alter table public.push_subscriptions drop constraint if exists push_subscriptions_endpoint_key;
create unique index if not exists push_subscriptions_business_endpoint_uidx
  on public.push_subscriptions (business_id, endpoint);
create index if not exists push_subscriptions_business_idx
  on public.push_subscriptions (business_id);

-- RLS: uključen BEZ politika => anon i authenticated ne mogu ništa čitati ni pisati.
-- Serverske rute koriste service role (zaobilazi RLS) i uvijek filtriraju po business_id iz provjerenog tokena.
alter table public.business_inquiries enable row level security;
alter table public.push_subscriptions enable row level security;
revoke all on public.business_inquiries from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;

-- Opcionalno, samo performanse (ne mijenja podatke): brže učitavanje rezervacija firme.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reservations' and column_name = 'business_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reservations' and column_name = 'reservation_date'
  ) then
    create index if not exists reservations_business_date_idx
      on public.reservations (business_id, reservation_date);
  end if;
end $$;
