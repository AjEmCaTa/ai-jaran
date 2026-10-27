-- PRODUKCIJA ILI TEST, SAMO ČITANJE. Poslije migracije: svaki red u koloni 'ok' mora biti true.
with tables as (select unnest(array['reservations','businesses','profiles','services','appointments','clients','business_inquiries','customer_notes','google_calendar_tokens','push_subscriptions']) t),
priv as (
  select t, r,
    has_table_privilege(r, 'public.'||t, 'select,insert,update,delete,truncate,references,trigger') as any_priv
  from tables, unnest(array['anon','authenticated']) r
)
select 'no_table_privileges:'||t||':'||r as check_name,
       case when t='profiles' and r='authenticated' then 'samo SELECT dozvoljen' else 'nijedna' end as expected,
       any_priv::text as observed,
       case when t='profiles' and r='authenticated' then has_table_privilege(r,'public.profiles','select') and not has_table_privilege(r,'public.profiles','insert,update,delete,truncate')
            else not any_priv end as ok
from priv
union all select 'rls_enabled:'||c.relname, 'true', c.relrowsecurity::text, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
union all select 'profiles.business_id nije izmjenjiv za authenticated', 'false', has_column_privilege('authenticated','public.profiles','business_id','update')::text, not has_column_privilege('authenticated','public.profiles','business_id','update')
union all select 'profiles.must_change_password izmjenjiv za authenticated', 'true', has_column_privilege('authenticated','public.profiles','must_change_password','update')::text, has_column_privilege('authenticated','public.profiles','must_change_password','update')
union all select 'anon nema pristup profiles', 'false', has_table_privilege('anon','public.profiles','select')::text, not has_table_privilege('anon','public.profiles','select')
union all select 'service_role ima pristup '||t, 'true', has_table_privilege('service_role','public.'||t,'select,insert,update,delete')::text, has_table_privilege('service_role','public.'||t,'select,insert,update,delete') from tables
union all select 'preostale politike na public', 'samo 2 na profiles', count(*)::text||' ('||coalesce(string_agg(tablename||'.'||policyname, ', '),'')||')',
       count(*) = 2 and bool_and(tablename='profiles' and policyname in ('profiles_select_own','profiles_update_own_flag')) from pg_policies where schemaname='public'
order by 1;
