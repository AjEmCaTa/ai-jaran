-- Povratak: uklanja kolonu (gubi se samo oznaka "podsjetnik poslan").
alter table public.reservations drop column if exists reminder_sent_at;
