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
