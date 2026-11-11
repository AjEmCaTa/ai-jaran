-- Automatska potvrda termina: nova rezervacija je odmah potvrđena (zadano za sve firme).
-- Firma može u postavkama uključiti ručnu potvrdu (auto_confirm = false).
-- Samo dodaje kolonu sa zadanom vrijednošću; postojeći podaci se ne mijenjaju.
alter table public.businesses add column if not exists auto_confirm boolean not null default true;
