import type { Metadata } from 'next';
import LegalPage from '../../components/LegalPage';

export const metadata: Metadata = {
  title: 'Povrat novca i otkazivanje | POSLO ONE',
  description: 'Pravila otkazivanja pretplate i povrata novca za POSLO ONE.',
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Povrat novca i otkazivanje"
      updated="5. novembar 2026."
      intro={<p>Želimo da plaćate samo ako vam POSLO ONE zaista koristi. Zato su pravila jednostavna.</p>}
      sections={[
        {
          title: '1. 30 dana besplatno',
          body: <p>Svaka nova firma prvih 30 dana koristi POSLO ONE besplatno. Ako vam ne odgovara, ne plaćate ništa.</p>,
        },
        {
          title: '2. Otkazivanje u bilo kojem trenutku',
          body: (
            <p>
              Pretplatu možete otkazati kad god želite, preko linka iz emaila s računom ili javljanjem na info@poslo.one.
              Nakon otkazivanja nema novih naplata, a paket vrijedi do kraja već plaćenog mjeseca.
            </p>
          ),
        },
        {
          title: '3. Povrat novca',
          body: (
            <>
              <p>
                Ako ste nezadovoljni, u roku od <b className="text-white">14 dana od prve uplate</b> vraćamo cijeli iznos te uplate,
                bez dodatnih pitanja.
              </p>
              <p>
                Za kasnije uplate povrat ne vršimo za već započeti mjesec, ali pretplatu možete otkazati da se ne obnovi. Ako
                platforma zbog naše greške nije radila duže vrijeme, javite nam se i dogovorit ćemo umanjenje ili povrat.
              </p>
            </>
          ),
        },
        {
          title: '4. Kako se vraća novac',
          body: (
            <p>
              Povrat ide na istu karticu ili račun s kojeg je plaćeno, preko Lemon Squeezyja, obično u roku od 5 do 10 radnih
              dana, zavisno od banke.
            </p>
          ),
        },
        {
          title: '5. Kontakt',
          body: (
            <p>
              <a className="text-blue-400 hover:text-blue-300" href="mailto:info@poslo.one">info@poslo.one</a> · 060 30 50 153
            </p>
          ),
        },
      ]}
      englishTitle="Refund and Cancellation Policy (English)"
      englishSections={[
        { title: 'Free trial', body: <p>New businesses get a 30-day free trial.</p> },
        { title: 'Cancellation', body: <p>You can cancel anytime via the link in your receipt email or at info@poslo.one. No further charges are made and the plan stays active until the end of the paid month.</p> },
        { title: 'Refunds', body: <p>Full refund of the first payment if requested within 14 days of that payment. Later payments are not refunded for a month already started, except in case of extended service outages caused by us. Refunds are issued via Lemon Squeezy to the original payment method within 5–10 business days.</p> },
        { title: 'Contact', body: <p>info@poslo.one · +387 60 30 50 153</p> },
      ]}
    />
  );
}
