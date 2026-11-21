'use client';

import Link from 'next/link';
import Footer from '../../components/Footer';
import { useT } from '../../components/site/LangProvider';

const TEXT = {
  bs: {
    back: 'Nazad na početnu',
    kicker: 'Jednostavni i transparentni paketi',
    title: 'Izaberi paket koji odgovara tvom biznisu.',
    lead: 'Započni sa 30 dana besplatnog korištenja, predstavi svoj biznis u katalogu i koristi osnovne funkcije rezervacija. Kada ti zatreba više kontrole, pređi na Pro paket.',
    perMonth: '/ mjesečno',
    starterText: 'Klijenti zakazuju sami, a ti samo potvrđuješ termine. Sve ostalo podesimo mi.',
    starterFeatures: [
      'Tvoja stranica za online zakazivanje',
      'Prisustvo u POSLO ONE katalogu, s logom',
      'Obavijesti o novim terminima i upitima',
      'Podsjetnik klijentu 24 h prije termina',
      'Panel za potvrđivanje i otkazivanje termina',
      'Usluge, cijene i radno vrijeme postavimo mi',
      '30 dana besplatno',
    ],
    starterCta: 'Probaj 30 dana besplatno',
    recommended: 'PREPORUČENO',
    proText: 'Za biznise koji žele potpunu kontrolu nad svojim profilom, uslugama, cijenama i radnim vremenom.',
    proFeatures: [
      'Sve iz Starter paketa',
      'Sam mijenjaš usluge, cijene i radno vrijeme',
      'Zaključani dani i godišnji odmor',
      'Molba za Google recenziju nakon termina',
      'Automatski poziv klijentu da ponovo zakaže',
      'QR poster i preporuke',
      'Prioritetna podrška',
      '30 dana besplatno',
    ],
    proCta: 'Probaj Pro 30 dana besplatno',
    trialNote: 'Prvih 30 dana ne plaćaš ništa i ne treba ti kartica. Nakon toga plaćaš mjesečno, a otkazati možeš bilo kada.',
    moreTitle: 'Potrebno ti je više?',
    moreText: 'POSLO ONE se može dodatno prilagoditi potrebama tvog biznisa. Po dogovoru možemo povezati dodatne kanale komunikacije, automatizacije, AI asistenta, Instagram, kalendar i druge poslovne alate.',
    moreNote: 'Dodatne funkcije nisu uključene u osnovne pakete i dogovaraju se zasebno prema potrebama biznisa.',
    compareTitle: 'Detaljna uporedba paketa',
    feature: 'Mogućnost',
    rows: [
      ['Cijena', '15 KM / mj', '50 KM / mj'],
      ['Katalog biznisa', '✓', '✓'],
      ['Rezervacije i kalendar', '✓', '✓'],
      ['Vlastiti dashboard', '—', '✓'],
      ['Uređivanje cijena i usluga', '—', '✓'],
      ['Upravljanje radnim vremenom', '—', '✓'],
      ['Upravljanje poslovnim profilom', 'Osnovno', 'Napredno'],
      ['AI odgovaranje klijentima', '—', 'Dodatna opcija'],
      ['Dodatne integracije', '—', 'Po dogovoru'],
    ],
    paymentNote: 'Prvih 30 dana je besplatno za oba paketa. Nakon toga se naplaćuje odabrani paket. Bez skrivenih troškova. Način plaćanja i detalji aktivacije dogovaraju se direktno.',
  },
  en: {
    back: 'Back to home',
    kicker: 'Simple, transparent plans',
    title: 'Choose the plan that fits your business.',
    lead: 'Start with 30 days free, list your business in the catalog and use the core booking features. When you need more control, switch to Pro.',
    perMonth: '/ month',
    starterText: 'Clients book on their own, and you just confirm. We set up everything else.',
    starterFeatures: [
      'Your own online booking page',
      'A listing in the POSLO ONE catalog, with your logo',
      'Notifications about new bookings and inquiries',
      'Client reminder 24 h before the appointment',
      'A panel to confirm and cancel bookings',
      'We set up your services, prices and hours',
      '30 days free',
    ],
    starterCta: 'Try 30 days free',
    recommended: 'RECOMMENDED',
    proText: 'For businesses that want full control over their profile, services, prices and working hours.',
    proFeatures: [
      'Everything in Starter',
      'Change services, prices and hours yourself',
      'Closed days and holidays',
      'Google review request after the appointment',
      'Automatic invite for the client to book again',
      'QR poster and referrals',
      'Priority support',
      '30 days free',
    ],
    proCta: 'Try Pro free for 30 days',
    trialNote: "You pay nothing for the first 30 days and don't need a card. After that you pay monthly and can cancel at any time.",
    moreTitle: 'Need more?',
    moreText: 'POSLO ONE can be tailored further to your business. By arrangement, we can connect extra communication channels, automations, an AI assistant, Instagram, your calendar and other business tools.',
    moreNote: 'Extra features are not included in the basic plans and are arranged separately, based on what your business needs.',
    compareTitle: 'Detailed plan comparison',
    feature: 'Feature',
    rows: [
      ['Price', '15 KM / mo', '50 KM / mo'],
      ['Business catalog', '✓', '✓'],
      ['Bookings and calendar', '✓', '✓'],
      ['Your own dashboard', '—', '✓'],
      ['Edit prices and services', '—', '✓'],
      ['Manage working hours', '—', '✓'],
      ['Business profile management', 'Basic', 'Advanced'],
      ['AI replies to clients', '—', 'Add-on'],
      ['Extra integrations', '—', 'By arrangement'],
    ],
    paymentNote: 'The first 30 days are free on both plans. After that, the chosen plan is billed. No hidden costs. Payment method and activation details are arranged directly.',
  },
};

// Boja ćelije u tabeli: kvačica plava, crtica siva, ostalo prema koloni.
function cellClass(value: string, pro: boolean) {
  if (value === '✓') return 'text-center text-blue-400';
  if (value === '—') return 'text-center text-slate-500';
  return pro ? 'text-center font-bold text-blue-400' : 'text-center text-slate-400';
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-blue-400">✓</span>
      <span>{children}</span>
    </li>
  );
}

export default function CjenovnikPage() {
  const t = useT(TEXT);

  return (
    <main className="min-h-screen bg-[#030712] text-white selection:bg-blue-600 selection:text-white">
      <section className="relative overflow-hidden px-6 pb-12 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-8 flex justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
            >
              <span>←</span> {t.back}
            </Link>
          </div>

          <span className="mb-4 block text-sm font-semibold uppercase tracking-wider text-blue-400">{t.kicker}</span>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">{t.title}</h1>
          <p className="mx-auto mb-16 max-w-2xl text-lg leading-relaxed text-slate-300">{t.lead}</p>

          <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-2">
            {/* STARTER */}
            <div className="relative flex flex-col justify-between rounded-[32px] border border-slate-800 bg-[#080d1c] p-8 shadow-xl sm:p-10">
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">Starter</h3>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white sm:text-5xl">15 KM</span>
                  <span className="text-slate-400">{t.perMonth}</span>
                </div>
                <p className="mb-8 text-sm text-slate-300">{t.starterText}</p>
                <ul className="mb-8 space-y-4 text-sm text-slate-300">
                  {t.starterFeatures.map((f) => <Check key={f}>{f}</Check>)}
                </ul>
              </div>
              <Link
                href="/registracija?paket=starter"
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-transparent py-4 font-semibold text-white transition-all hover:bg-slate-800"
              >
                {t.starterCta}
              </Link>
            </div>

            {/* PRO */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-blue-500/50 bg-gradient-to-b from-[#080d1c] to-[#040814] p-8 shadow-2xl sm:p-10">
              <div className="absolute right-4 top-4 rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-xs font-bold text-blue-400">
                {t.recommended}
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">POSLO ONE Pro</h3>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white sm:text-5xl">50 KM</span>
                  <span className="text-slate-400">{t.perMonth}</span>
                </div>
                <p className="mb-8 text-sm text-slate-300">{t.proText}</p>
                <ul className="mb-8 space-y-4 text-sm text-slate-200">
                  {t.proFeatures.map((f) => <Check key={f}>{f}</Check>)}
                </ul>
              </div>
              <Link
                href="/registracija?paket=pro"
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] hover:bg-blue-500"
              >
                {t.proCta}
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">{t.trialNote}</p>

          <div className="mt-16 rounded-3xl border border-blue-500/15 bg-[#080d1c]/60 p-8 text-left backdrop-blur-xl">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-center text-2xl font-bold text-white sm:text-3xl">{t.moreTitle}</h2>
              <p className="text-center text-sm leading-relaxed text-slate-300 sm:text-base">{t.moreText}</p>
              <p className="mt-4 text-center text-sm text-slate-400">{t.moreNote}</p>
            </div>
          </div>

          <div className="mt-24 text-left">
            <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">{t.compareTitle}</h2>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#080d1c] shadow-xl">
              <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02] p-6 text-sm font-bold sm:text-base">
                <div>{t.feature}</div>
                <div className="text-center">Starter</div>
                <div className="text-center text-blue-400">POSLO ONE Pro</div>
              </div>
              <div className="divide-y divide-white/5 text-sm text-slate-300">
                {t.rows.map(([label, starter, pro]) => (
                  <div key={label} className="grid grid-cols-3 items-center p-6">
                    <div className="font-medium text-white">{label}</div>
                    <div className={cellClass(starter, false)}>{starter}</div>
                    <div className={cellClass(pro, true)}>{pro}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">{t.paymentNote}</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
