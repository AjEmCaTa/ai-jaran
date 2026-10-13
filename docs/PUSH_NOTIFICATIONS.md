# Web push obavijesti za nove upite

Tok: javni profil firme → `POST /api/business-inquiry` → upit se sprema u `business_inquiries`
(odvojeno od rezervacija i prihoda) → push svim pretplatama **te firme** (`push_subscriptions.business_id`)
→ klik na obavijest otvara `/dashboard/inquiries?id=<id upita>`. E-mail se šalje kao i prije.

## 1. Baza (ručno, prvo na Preview/test bazi)
Pokrenite `supabase/migrations/20261012_push_and_inquiries.sql` u Supabase SQL editoru.
RLS je uključen bez politika: anon ključ ne može čitati/pisati; pristup je samo kroz serverske rute.
Bez ovih tabela upit i e-mail i dalje rade, samo nema push-a/liste upita (greška u logu).

## 2. VAPID ključevi
```
npx web-push generate-vapid-keys
```
Postavite u Vercel (**samo Preview okruženje za test**, Settings → Environment Variables):
- `VAPID_PUBLIC_KEY` – javni ključ
- `VAPID_PRIVATE_KEY` – privatni ključ (tajna, nikad u repozitorij)
- `VAPID_SUBJECT` – npr. `mailto:info@poslo.one`

Nakon promjene varijabli napravite novi Preview deploy. Ako se ključevi kasnije promijene, postojeće
pretplate postaju nevažeće (korisnik mora ponovo uključiti obavijesti).

## 3. Test na mobitelu (Preview)
1. **Android (Chrome):** otvorite Preview URL → `/prijava` kao Dubinsko Ćatić → Upiti → "Uključi obavijesti" → Dozvoli.
2. **iPhone (iOS 16.4+):** Safari → Dijeli → "Dodaj na početni ekran", otvorite instaliranu aplikaciju, pa isto kao gore (push radi samo iz instalirane web aplikacije).
3. Na drugom uređaju otvorite `/katalog/dubinsko-catic` → "Imate pitanje?" → pošaljite upit.
4. Očekivano: obavijest "Novi upit" (bez telefona/poruke); klik otvara `/dashboard/inquiries?id=…` s označenim upitom.
5. Prijavite se kao Sun Solution (drugi uređaj/preglednik): ne smije stići obavijest, ni vidjeti upit Ćatića.
6. Provjerite da kontrolna ploča/statistika prihoda NISU promijenjene upitom.
7. "Isključi" → novi upit više ne šalje obavijest tom uređaju.

---

# Automatizacija rezervacija (sve firme)

Koristi iste VAPID varijable i iste tabele kao gore; **za rezervacije nije potrebna nova migracija**
(koristi se postojeća kolona `reservations.status`, kao tekst).

## Tok
1. Klijent rezerviše (`POST /api/narudzbe`): server provjerava preklapanje (409 ako je zauzeto), upisuje zahtjev sa statusom
   „Na cekanju“ (prikazuje se kao **Zahtjev**) i šalje push samo pretplatama te firme (`business_id`).
2. Obavijest otvara `/dashboard/reservations?id=<id>` (red je označen). Akcije (`PATCH /api/dashboard/reservations`, `action`):
   - **Potvrdi** → „Potvrđeno“; **Dogovori termin** → novi datum/vrijeme + „Dogovor termina“; **Završi** → „Završeno“; **Otkaži** → „Otkazano“.
   - Dvostruka potvrda i promjena završenih/otkazanih vraća 409. Ažuriranje je uvjetno (status mora biti onakav kakav je pročitan).
   - Potvrda i novi termin provjeravaju preklapanje s drugim rezervacijama iste firme (409).
3. Klijent otkazuje (`/api/cancel-appointment`): sada traži prijavu i vlasništvo (`user_id`); vlasnik dobiva push.
4. **Prihod** se i dalje računa isključivo iz statusa „Završeno“ (nepromijenjena logika u `app/dashboard/page.tsx`).
   Zahtjevi, potvrđene, otkazane i „Dogovor termina“ ne ulaze u prihod. Upiti (`business_inquiries`) su posebna tabela.

## iPhone
Push radi samo iz aplikacije na početnom ekranu (iOS 16.4+): Safari → Dijeli → Dodaj na početni ekran → otvoriti
POSLO ONE s ikone → Dashboard → Rezervacije → „Uključi obavijesti“. Dashboard prikazuje ove korake kad detektuje iOS u Safariju.

## Test na Dubinsko Ćatić Preview
Preduslov: migracija iz odjeljka 1, VAPID varijable na Previewu, novi Preview deploy.
1. Telefon A (Android Chrome ili iPhone instaliran na početni ekran): prijava kao Ćatić → Rezervacije → „Uključi obavijesti“.
2. Telefon/računar B: `/katalog/dubinsko-catic`, prijava klijentskim računom, rezervišite slobodan termin.
   Očekivano: na A stiže „Novi zahtjev za rezervaciju“ (bez imena/telefona); klik otvara označenu rezervaciju kao **Zahtjev**.
3. Pokušajte istim računom isti ili preklapajući termin: očekivana poruka da je termin zauzet (409).
4. Kliknite **Potvrdi** → status „Potvrđeno“; brzo drugi klik/drugi uređaj: poruka da je već obrađeno.
5. **Dogovori termin** → odaberite novi termin; pokušaj na zauzeti termin mora odbiti.
6. Na B otkažite termin (`/katalog/dubinsko-catic` → Otkaži): A dobija push „Klijent je otkazao termin“.
7. **Otkaži** iz dashboarda: status „Otkazano“; termin se opet može rezervisati.
8. **Završi** na potvrđenoj rezervaciji: tek tada raste prihod na kontrolnoj ploči.
9. Sun Solution račun (drugi preglednik) ne smije dobiti obavijest niti vidjeti Ćatićeve rezervacije.
