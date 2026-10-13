-- Usluge: opcija cijene "Na upit". Postojeći podaci ostaju netaknuti (price_on_request = false).
alter table public.services add column if not exists price_on_request boolean not null default false;
alter table public.services alter column price drop not null;
