-- Poslovi za firme koje rade po upitima (građevina i sl.). Samo NOVA, prazna (nullable) polja:
-- postojeći upiti, rezervacije i kod koji čita stare kolone rade isto kao prije.
alter table public.business_inquiries
  add column if not exists stage text check (stage in ('new','contacted','offer','agreed','done','lost')),
  add column if not exists quote numeric(12,2) check (quote >= 0),
  add column if not exists deposit numeric(12,2) check (deposit >= 0),
  add column if not exists paid numeric(12,2) check (paid >= 0),
  add column if not exists costs numeric(12,2) check (costs >= 0),
  add column if not exists note text,
  add column if not exists started_on date,
  add column if not exists finished_on date,
  add column if not exists source text check (source in ('web','manual')),
  add column if not exists review_sent_at timestamptz,
  add column if not exists updated_at timestamptz;

-- null = automatski (uključeno ako su sve usluge "na upit" ili je djelatnost građevina), 'on' / 'off' = ručno.
alter table public.businesses
  add column if not exists jobs_mode text check (jobs_mode in ('on','off'));
