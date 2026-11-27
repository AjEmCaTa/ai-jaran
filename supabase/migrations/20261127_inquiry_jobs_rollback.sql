alter table public.business_inquiries
  drop column if exists stage, drop column if exists quote, drop column if exists deposit, drop column if exists paid,
  drop column if exists costs, drop column if exists note, drop column if exists started_on, drop column if exists finished_on,
  drop column if exists source, drop column if exists review_sent_at, drop column if exists updated_at;
alter table public.businesses drop column if exists jobs_mode;
