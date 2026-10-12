-- NIJE primijenjeno automatski. Pokrenite ručno u Supabase SQL editoru (prvo na Preview/test bazi).
-- Upiti (inquiries) su odvojeni od rezervacija i prihoda: ne ulaze u statistiku.

create table if not exists public.business_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  service text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);
create index if not exists business_inquiries_business_created_idx
  on public.business_inquiries (business_id, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_business_idx on public.push_subscriptions (business_id);

-- RLS uključen bez ikakvih politika: anon/authenticated ključ NE može čitati ni pisati.
-- Pristup je samo kroz serverske rute (service role) koje filtriraju po business_id.
alter table public.business_inquiries enable row level security;
alter table public.push_subscriptions enable row level security;
