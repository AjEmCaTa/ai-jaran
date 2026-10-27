-- TEST PROJEKAT, PISANJE (samo probni podaci). Pokreće se NAKON što su dva probna vlasnika registrovana kroz /api/register-business.
-- Aktivira ta dva probna biznisa (ownerAuth traži status 'active') i dodaje po jednu rezervaciju i uslugu da se izolacija može provjeriti.
-- Sve je vezano za e-mail adrese *.invalid; ne dira ništa drugo.
update public.businesses set status = 'active' where owner_email in ('rls-owner-a@example.invalid', 'rls-owner-b@example.invalid');
insert into public.services (user_id, business_id, name, duration, price)
  select p.id, p.business_id, 'Probna usluga ' || b.name, '30 min', 10 from public.profiles p join public.businesses b on b.id = p.business_id
  where p.email in ('rls-owner-a@example.invalid', 'rls-owner-b@example.invalid');
insert into public.reservations (user_id, business_id, customer_name, customer_phone, customer_email, service_name, reservation_date, status)
  select p.id, p.business_id, 'Probni klijent', '061000000', 'klijent@example.invalid', 'Probna usluga', '2030-06-01T10:00', 'Na čekanju'
  from public.profiles p where p.email in ('rls-owner-a@example.invalid', 'rls-owner-b@example.invalid');
select b.name, b.status, (select count(*) from public.reservations r where r.business_id = b.id) reservations from public.businesses b order by b.name;
