-- PRODUKCIJA, SAMO ČITANJE (SELECT). Pokrenuti prije svega; rezultate sačuvati uz release zapis.
-- Cilj: potvrditi da je stanje isto kao kad je migracija testirana (supabase/tests/baseline_*.sql).
select 'project_db' k, current_database() v;
select 'rls:'||c.relname k, c.relrowsecurity::text v from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' order by 1;
select 'policy:'||tablename||':'||policyname k, cmd||' roles='||roles::text||' using='||coalesce(qual,'-')||' check='||coalesce(with_check,'-') v
  from pg_policies where schemaname='public' order by 1;
select 'grant:'||table_name||':'||grantee k, string_agg(privilege_type, ',' order by privilege_type) v
  from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated','service_role')
  group by table_name, grantee order by 1;
select 'rows:'||t k, (xpath('/row/c/text()', query_to_xml(format('select count(*) c from public.%I', t), false, true, '')))[1]::text v
  from unnest(array['reservations','businesses','profiles','services','business_inquiries','customer_notes','push_subscriptions','google_calendar_tokens','appointments','clients']) t;
select 'profiles_without_business' k, count(*)::text v from public.profiles where business_id is null;
select 'profiles_with_missing_business' k, count(*)::text v from public.profiles p where business_id is not null and not exists (select 1 from public.businesses b where b.id=p.business_id);
select 'business_status:'||coalesce(status,'NULL') k, count(*)::text v from public.businesses group by status;
select 'default_acl' k, coalesce(string_agg(defaclrole::regrole::text||':'||defaclobjtype::text||':'||defaclacl::text, ' | '),'none') v from pg_default_acl where defaclnamespace='public'::regnamespace;
select 'event_trigger:'||evtname k, evtfoid::regproc::text v from pg_event_trigger;
select 'public_tables_not_covered:'||table_name k, 'pregledati prije migracije' v from information_schema.tables
  where table_schema='public' and table_type='BASE TABLE'
  and table_name not in ('reservations','businesses','profiles','services','business_inquiries','customer_notes','push_subscriptions','google_calendar_tokens','appointments','clients');
