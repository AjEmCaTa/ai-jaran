import type { Metadata } from 'next';
import LegalPage from '../../components/LegalPage';

export const metadata: Metadata = {
  title: 'Politika privatnosti | POSLO ONE',
  description: 'Kako POSLO ONE prikuplja, koristi i štiti lične podatke.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politika privatnosti"
      updated="5. novembar 2026."
      intro={
        <p>
          Ova politika objašnjava koje podatke POSLO ONE (poslo.one, Harun Ćatić, Mostar, Bosna i Hercegovina) prikuplja,
          zašto i kako ih štitimo.
        </p>
      }
      sections={[
        {
          title: '1. Koje podatke prikupljamo',
          body: (
            <>
              <p><b className="text-white">Firme:</b> naziv, djelatnost, grad, adresa, telefon, email, ime vlasnika, usluge, cijene i radno vrijeme.</p>
              <p><b className="text-white">Klijenti firmi:</b> ime i prezime, telefon, email, odabrana usluga i termin, te sadržaj upita koji pošalju.</p>
              <p><b className="text-white">Tehnički podaci:</b> osnovni podaci o posjetama (stranica, uređaj, približna lokacija) za statistiku i zaštitu od zloupotrebe.</p>
            </>
          ),
        },
        {
          title: '2. Zašto ih koristimo',
          body: (
            <p>
              Da bi zakazivanje radilo: prikaz slobodnih termina, slanje potvrda, podsjetnika i obavijesti firmi i klijentu,
              molbe za recenziju i poziva na novi termin (samo ako ih firma uključi), naplata pretplate i podrška. Podatke ne
              prodajemo i ne koristimo za oglašavanje trećih strana.
            </p>
          ),
        },
        {
          title: '3. Ko još obrađuje podatke',
          body: (
            <p>
              Koristimo provjerene servise: Supabase (baza podataka), Vercel (hosting i statistika posjeta), Resend (slanje
              emailova), Lemon Squeezy (plaćanje; podatke o kartici vidi samo on) i Google Analytics (statistika posjeta).
              Podaci svake firme su odvojeni i firma vidi samo svoje termine i klijente.
            </p>
          ),
        },
        {
          title: '4. Koliko dugo čuvamo podatke',
          body: (
            <p>
              Dok je nalog firme aktivan i koliko je potrebno zbog zakonskih obaveza. Na zahtjev brišemo podatke, osim onih
              koje moramo čuvati po zakonu.
            </p>
          ),
        },
        {
          title: '5. Vaša prava',
          body: (
            <p>
              Možete zatražiti uvid, ispravku ili brisanje svojih podataka, kao i odjavu od emailova koji nisu nužni za termin.
              Klijent firme se za svoje termine može obratiti i direktno firmi.
            </p>
          ),
        },
        {
          title: '6. Kontakt',
          body: (
            <p>
              Za sva pitanja o privatnosti: <a className="text-blue-400 hover:text-blue-300" href="mailto:info@poslo.one">info@poslo.one</a> · 060 30 50 153.
            </p>
          ),
        },
      ]}
      englishTitle="Privacy Policy (English)"
      englishSections={[
        { title: 'Data we collect', body: <p>Business details (name, contact, services, prices, hours); customer details needed for bookings (name, phone, email, booked service and time, inquiry text); basic analytics data.</p> },
        { title: 'Purpose', body: <p>To run bookings, send confirmations, reminders and notifications, optional review and rebooking emails enabled by the business, billing and support. We do not sell personal data.</p> },
        { title: 'Processors', body: <p>Supabase (database), Vercel (hosting, analytics), Resend (email), Lemon Squeezy (payments, card data handled only by them), Google Analytics.</p> },
        { title: 'Your rights', body: <p>You may request access, correction or deletion of your data at info@poslo.one.</p> },
      ]}
    />
  );
}
