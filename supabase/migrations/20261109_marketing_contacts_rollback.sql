-- Povrat faze 1 marketinga. Briše SAMO marketing tabele (postojeće tabele se ne diraju).
drop trigger if exists marketing_contacts_touch on public.marketing_contacts;
drop function if exists public.marketing_touch_updated_at();
drop function if exists public.marketing_contact_sendable(public.marketing_contacts);
drop table if exists public.marketing_activity_log;
drop table if exists public.marketing_contacts;
drop table if exists public.marketing_imports;
