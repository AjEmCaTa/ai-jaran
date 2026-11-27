import type { Metadata } from 'next';
import LegalPage from '../../components/LegalPage';

export const metadata: Metadata = {
  title: 'Brisanje naloga | POSLO ONE',
  description: 'Kako obrisati POSLO ONE nalog i koji se podaci brišu.',
};

const link = 'text-blue-400 hover:text-blue-300';

export default function DeleteAccountPage() {
  return (
    <LegalPage
      title="Brisanje naloga"
      updated="27. novembar 2026."
      intro={
        <p>
          Ova stranica objašnjava kako obrisati nalog u aplikaciji i na stranici POSLO ONE (poslo.one, Harun Ćatić, Mostar)
          i šta se tada dešava s vašim podacima.
        </p>
      }
      sections={[
        {
          title: '1. Brisanje u aplikaciji ili na stranici',
          body: (
            <ol className="list-decimal space-y-1 pl-5">
              <li>Prijavite se u aplikaciju POSLO ONE ili na poslo.one.</li>
              <li>Otvorite <b className="text-white">Profil</b>.</li>
              <li>Na dnu kliknite <b className="text-white">Brisanje računa</b>.</li>
              <li>Potvrdite klikom na <b className="text-white">Da, obriši račun</b>. Račun se briše odmah.</li>
            </ol>
          ),
        },
        {
          title: '2. Brisanje putem e-maila',
          body: (
            <p>
              Ako ne možete pristupiti nalogu, ili ste vlasnik firme, pošaljite zahtjev s e-mail adrese naloga na{' '}
              <a className={link} href="mailto:info@poslo.one?subject=Brisanje%20naloga">info@poslo.one</a> s naslovom
              „Brisanje naloga”. Zahtjev obrađujemo u roku od 30 dana.
            </p>
          ),
        },
        {
          title: '3. Šta se briše',
          body: (
            <p>
              Trajno se brišu nalog i podaci za prijavu: ime, e-mail, telefon, lozinka, profilna slika i povezivanje s Google
              prijavom. Vlasniku firme na zahtjev brišemo i profil firme, usluge, radno vrijeme i slike.
            </p>
          ),
        },
        {
          title: '4. Šta se zadržava',
          body: (
            <p>
              Termini i upiti koje ste poslali firmama ostaju kod tih firmi kao njihova evidencija, ali više nisu povezani s
              vašim nalogom. Firmu možete direktno zamoliti da ih obriše. Podatke o plaćanju pretplate čuvamo koliko zakon
              nalaže (računovodstvene obaveze). Sigurnosne kopije baze se automatski brišu najkasnije za 30 dana.
            </p>
          ),
        },
      ]}
      englishTitle="Account deletion (English)"
      englishSections={[
        { title: 'In the app', body: <p>Sign in to the POSLO ONE app or poslo.one, open Profile, tap “Delete account” (BS: “Brisanje računa”) and confirm. The account is deleted immediately.</p> },
        { title: 'By e-mail', body: <p>If you cannot sign in, or you own a business account, e-mail <a className={link} href="mailto:info@poslo.one?subject=Account%20deletion">info@poslo.one</a> from your account address with the subject “Account deletion”. We process requests within 30 days.</p> },
        { title: 'Deleted', body: <p>Your account and sign-in data: name, e-mail, phone, password, profile photo and Google sign-in link. For business owners, on request, the business profile, services, hours and images.</p> },
        { title: 'Kept', body: <p>Bookings and inquiries you sent stay with those businesses as their records, no longer linked to your account. Subscription payment records are kept as required by law. Database backups are removed within 30 days.</p> },
      ]}
    />
  );
}
