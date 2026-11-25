'use client';

import Footer from '../../components/Footer';
import Icon from '../../components/Icon';
import CatalogBrowser from '../../components/catalog/CatalogBrowser';
import { useLang } from '../../components/site/LangProvider';
import { useSite } from '../../components/site/siteContext';

const TEXT = {
  bs: {
    kicker: 'Katalog Biznisa', title: 'Izaberi djelatnost',
    lead: 'Pregledaj industrije i sektore za koje POSLO ONE pruža napredne mogućnosti upravljanja poslovanjem, rezervacijama i terminima.',
    filter: 'Filtriraj lokaciju:', allCities: 'Svi gradovi', soon: 'Uskoro', one: '1 firma', many: (n: number) => `${n} firmi`,
    city: 'Grad:', view: 'Pregledaj →', firms: 'Firme', inCity: (c: string) => ` u gradu ${c}`, services: 'Usluge', book: 'Zakaži →',
    joinKicker: 'Budi dio mreže', joinTitle: 'Želiš i svoj biznis u POSLO ONE katalogu?',
    joinText: 'Predstavi svoj biznis na POSLO ONE platformi i omogući klijentima jednostavan pristup informacijama, rezervacijama i terminima. Kontaktiraj nas i dogovorit ćemo sve detalje.',
    joinCta: 'Želim svoj biznis u katalogu',
  },
  en: {
    kicker: 'Business Catalog', title: 'Choose a category',
    lead: 'Browse the industries where POSLO ONE helps businesses manage their work, bookings and appointments.',
    filter: 'Filter by location:', allCities: 'All cities', soon: 'Coming soon', one: '1 business', many: (n: number) => `${n} businesses`,
    city: 'City:', view: 'View →', firms: 'Businesses', inCity: (c: string) => ` in ${c}`, services: 'Services', book: 'Book →',
    joinKicker: 'Join the network', joinTitle: 'Want your business in the POSLO ONE catalog?',
    joinText: 'Present your business on POSLO ONE and give clients easy access to your information, bookings and appointments. Contact us and we will arrange everything.',
    joinCta: 'I want my business in the catalog',
  },
};

import type { CatalogBusiness } from '../../utils/catalogData';

// Podaci stižu sa servera zajedno sa stranicom; prikaz kataloga je u CatalogBrowser (isti i na početnoj).
export default function KatalogClient({ businesses, retry = false }: { businesses: CatalogBusiness[]; retry?: boolean }) {
  const { lang } = useLang();
  const t = TEXT[lang];
  const { openContact } = useSite();

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">

      <div className="pt-28 pb-16 px-4 sm:pt-36 sm:pb-24 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="px-3.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-wider inline-block">
            {t.kicker}
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            {t.title}
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            {t.lead}
          </p>
        </div>

        <CatalogBrowser businesses={businesses} retry={retry} />

        {/* Sekcija za prijavu biznisa */}
        <div className="mt-16 bg-gray-900/40 border border-slate-800/80 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-wider inline-block">
              {t.joinKicker}
            </span>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {t.joinTitle}
            </h2>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              {t.joinText}
            </p>

            <div className="pt-2">
              <button
                onClick={() => openContact('Prijava biznisa u katalog')}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
              >
                <Icon name="mail" className="h-4 w-4" /> {t.joinCta}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
