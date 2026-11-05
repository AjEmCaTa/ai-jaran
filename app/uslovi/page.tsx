import type { Metadata } from 'next';
import LegalPage from '../../components/LegalPage';

export const metadata: Metadata = {
  title: 'Uslovi korištenja | POSLO ONE',
  description: 'Uslovi korištenja platforme POSLO ONE za online zakazivanje termina.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Uslovi korištenja"
      updated="5. novembar 2026."
      intro={
        <p>
          Ovi uslovi vrijede za korištenje platforme POSLO ONE (poslo.one). Platformu vodi Harun Ćatić iz Mostara, Bosna i
          Hercegovina (u daljem tekstu: „POSLO ONE”, „mi”). Korištenjem platforme prihvatate ove uslove.
        </p>
      }
      sections={[
        {
          title: '1. Šta je POSLO ONE',
          body: (
            <p>
              POSLO ONE je softver za online zakazivanje termina namijenjen malim firmama (saloni, servisi, autopraonice i
              slično). Firma dobija svoju stranicu za zakazivanje i panel za upravljanje terminima, a njeni klijenti zakazuju
              termine i šalju upite preko te stranice.
            </p>
          ),
        },
        {
          title: '2. Nalozi',
          body: (
            <>
              <p>
                Firma otvara nalog registracijom i odgovorna je za tačnost podataka koje unese (naziv, kontakt, usluge,
                cijene, radno vrijeme) i za čuvanje svoje lozinke. Nalog firme aktiviramo nakon provjere.
              </p>
              <p>
                Klijenti firmi mogu se prijaviti da bi zakazali termin. Termin je dogovor između klijenta i firme; POSLO ONE
                nije strana u tom dogovoru i ne odgovara za izvršenje usluge.
              </p>
            </>
          ),
        },
        {
          title: '3. Paketi, probni period i plaćanje',
          body: (
            <>
              <p>
                Paketi su opisani na stranici <a className="text-blue-400 hover:text-blue-300" href="/cjenovnik">Cjenovnik</a>.
                Nova firma dobija 30 dana besplatnog korištenja. Nakon toga paket se plaća mjesečno, unaprijed.
              </p>
              <p>
                Online plaćanje karticom obrađuje Lemon Squeezy (Lemon Squeezy LLC), koji je zvanični prodavac (merchant of
                record) i izdaje račun kupcu. Podatke o kartici ne vidimo i ne čuvamo. Pretplata se automatski obnavlja dok je
                ne otkažete.
              </p>
              <p>
                Ako paket nije plaćen, zakazivanje preko stranice firme i panel se privremeno zaključavaju. Podaci se ne brišu
                i sve se vraća nakon uplate.
              </p>
            </>
          ),
        },
        {
          title: '4. Pravila korištenja',
          body: (
            <p>
              Zabranjeno je koristiti platformu za nezakonite djelatnosti, slanje neželjenih poruka, lažno predstavljanje,
              pokušaje neovlaštenog pristupa ili ometanje rada platforme. Nalog koji krši ova pravila možemo suspendovati.
            </p>
          ),
        },
        {
          title: '5. Dostupnost i odgovornost',
          body: (
            <p>
              Trudimo se da platforma radi bez prekida, ali ne možemo garantovati neprekidan rad. POSLO ONE ne odgovara za
              izgubljenu zaradu ili indirektnu štetu nastalu korištenjem platforme. Naša ukupna odgovornost ograničena je na
              iznos koji je firma platila u posljednja tri mjeseca.
            </p>
          ),
        },
        {
          title: '6. Otkazivanje',
          body: (
            <p>
              Pretplatu možete otkazati u bilo kojem trenutku; vrijedi do kraja plaćenog perioda. Detalji su na stranici{' '}
              <a className="text-blue-400 hover:text-blue-300" href="/povrat-novca">Povrat novca i otkazivanje</a>.
            </p>
          ),
        },
        {
          title: '7. Izmjene i kontakt',
          body: (
            <p>
              O bitnim izmjenama uslova obavijestit ćemo firme emailom. Za pitanja pišite na{' '}
              <a className="text-blue-400 hover:text-blue-300" href="mailto:info@poslo.one">info@poslo.one</a> ili nazovite
              060 30 50 153.
            </p>
          ),
        },
      ]}
      englishTitle="Terms of Service (English)"
      englishSections={[
        { title: 'Service', body: <p>POSLO ONE (poslo.one) is online booking software (SaaS) for small businesses, operated by Harun Ćatić, Mostar, Bosnia and Herzegovina. Businesses get a booking page and a dashboard; their customers book appointments and send inquiries through that page.</p> },
        { title: 'Accounts', body: <p>Businesses are responsible for the accuracy of their data and for keeping their credentials safe. Appointments are agreements between the customer and the business; POSLO ONE is not a party to them.</p> },
        { title: 'Plans and billing', body: <p>Plans are listed on the Pricing page. New businesses get a 30-day free trial, after which the plan is billed monthly in advance. Payments are processed by Lemon Squeezy, our merchant of record. Subscriptions renew automatically until cancelled. Unpaid plans are paused (no data is deleted) until payment.</p> },
        { title: 'Acceptable use', body: <p>Illegal activity, spam, impersonation, unauthorized access attempts and disrupting the service are prohibited and may lead to suspension.</p> },
        { title: 'Liability', body: <p>The service is provided as is. Our total liability is limited to the amount paid by the business in the last three months.</p> },
        { title: 'Contact', body: <p>info@poslo.one · +387 60 30 50 153</p> },
      ]}
    />
  );
}
