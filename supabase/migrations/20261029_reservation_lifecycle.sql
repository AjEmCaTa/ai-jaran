-- Faza 2: životni ciklus rezervacija. Samo DODAVANJE kolone (nema promjene ni brisanja podataka).
-- Kod toleriše odsustvo kolone samo u starim verzijama; novi kod je traži, pa se migracija pokreće PRIJE deploya.
alter table public.reservations add column if not exists reminder_sent_at timestamptz;
