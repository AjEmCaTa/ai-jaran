-- Ograničenja i indeksi kao na produkciji (snimljeno read-only iz pg_constraint/pg_indexes, 2026-10-27).
-- Aplikacija se na njih oslanja: unique slug (registracija ponavlja pri 23505), unique (business_id, endpoint) za push upsert,
-- unique (business_id, customer_key) za bilješke, strani ključevi. Produkcija nema trigger-a ni funkcija u public šemi.
alter table public.businesses add constraint businesses_slug_key unique (slug);
alter table public.clients add constraint clients_slug_key unique (slug);
alter table public.appointments add constraint appointments_client_id_fkey foreign key (client_id) references public.clients(id) on delete cascade;
alter table public.business_inquiries add constraint business_inquiries_business_id_fkey foreign key (business_id) references public.businesses(id) on delete cascade;
alter table public.business_inquiries add constraint business_inquiries_status_check check (status = any (array['new'::text, 'handled'::text]));
alter table public.customer_notes add constraint customer_notes_business_id_customer_key_key unique (business_id, customer_key);
alter table public.profiles add constraint profiles_business_id_fkey foreign key (business_id) references public.businesses(id);
alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.push_subscriptions add constraint push_subscriptions_business_id_fkey foreign key (business_id) references public.businesses(id) on delete cascade;
alter table public.reservations add constraint reservations_business_id_fkey foreign key (business_id) references public.businesses(id);
alter table public.reservations add constraint reservations_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.services add constraint services_business_id_fkey foreign key (business_id) references public.businesses(id);
alter table public.services add constraint services_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
create index business_inquiries_business_created_idx on public.business_inquiries using btree (business_id, created_at desc);
create unique index push_subscriptions_business_endpoint_uidx on public.push_subscriptions using btree (business_id, endpoint);
create index push_subscriptions_business_idx on public.push_subscriptions using btree (business_id);
create index reservations_business_date_idx on public.reservations using btree (business_id, reservation_date);
