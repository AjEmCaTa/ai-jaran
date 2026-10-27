-- NAMJERNO RANJIVE politike, samo one potrebne za dokaz napada (tačna kopija produkcijskih).
-- NIKADA se ne smije trajno pokrenuti. Koristi se isključivo u "Pokretanju 1" unutar transakcije
-- koja se uvijek poništava (kraj testa baca izuzetak), pa ove politike nikad ne ostaju u bazi.
-- Pokrivaju: čitanje/upis/brisanje rezervacija za svakoga, javno čitanje biznisa (uklj. owner_email,
-- telegram_chat_id), izmjena vlastitog profila bez ograničenja kolona (business_id), ALL na uslugama po user_id.
create policy "Omogući javni upis" on public.reservations for insert to public with check (true);
create policy "Omogući javno brisanje" on public.reservations for delete to public using (true);
create policy "Omogući javno čitanje" on public.reservations for select to public using (true);
create policy "Korisnici mogu upravljati svojim rezervacijama" on public.reservations for all to public using (auth.uid() = user_id);
create policy "Allow authenticated users to insert businesses" on public.businesses for insert to authenticated with check (true);
create policy "Allow public read access to businesses" on public.businesses for select to anon, authenticated using (true);
create policy "Users can insert own profile" on public.profiles for insert to public with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to public using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can view own profile" on public.profiles for select to public using (auth.uid() = id);
create policy "Korisnici mogu upravljati svojim uslugama" on public.services for all to public using (auth.uid() = user_id);
