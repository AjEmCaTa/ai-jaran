'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Footer from '../../components/Footer';
import Icon from '../../components/Icon';
import PartnerLogo from '../../components/PartnerLogo';
import RevealImg from '../../components/site/RevealImg';
import { useLang } from '../../components/site/LangProvider';
import { useSite } from '../../components/site/siteContext';
import { CATALOG_CATEGORIES, categoryBySlug, categoryText } from '../../utils/catalog';

const ALL = '__all__';

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

// Podaci stižu sa servera zajedno sa stranicom, pa se kartice i brojke prikažu odmah,
// bez "skakanja" redoslijeda kad se podaci kasnije učitaju.
export default function KatalogClient({ businesses: initial, retry = false }: { businesses: CatalogBusiness[]; retry?: boolean }) {
  const [businesses, setBusinesses] = useState(initial);
  useEffect(() => {
    if (!retry) return;
    let stop = false;
    (async () => {
      for (let i = 0; i < 3 && !stop; i += 1) {
        const res = await fetch('/api/catalog', { cache: 'no-store' }).catch(() => null);
        const json = res?.ok ? await res.json().catch(() => null) : null;
        if (json?.businesses) {
          setBusinesses(json.businesses);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    })();
    return () => {
      stop = true;
    };
  }, [retry]);
  const { lang } = useLang();
  const t = TEXT[lang];
  const { openContact } = useSite();
  const [selectedCity, setSelectedCity] = useState(ALL);

  const cities = useMemo(
    () => [ALL, ...Array.from(new Set(businesses.map((b) => b.city.trim()).filter(Boolean))).sort((x, y) => x.localeCompare(y, "bs"))],
    [businesses]
  );
  const visible = useMemo(
    () => (selectedCity === ALL ? businesses : businesses.filter((b) => b.city.trim() === selectedCity)),
    [businesses, selectedCity]
  );
  const categories = useMemo(
    () =>
      CATALOG_CATEGORIES.map((c) => ({ ...c, count: visible.filter((b) => b.category === c.slug).length }))
        .filter((c) => c.slug !== "ostale-usluge" || c.count > 0)
        .sort((x, y) => y.count - x.count),
    [visible]
  );
  const cityLabel = (city: string) => (city === ALL ? t.allCities : city);

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

          {/* Filter gradova */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-xs text-slate-400 font-medium mr-2">
              <Icon name="mapPin" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />{t.filter}
            </span>

            {cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  selectedCity === city
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 font-bold"
                    : "bg-[#030712] text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                {cityLabel(city)}
              </button>
            ))}
          </div>
        </div>

        {/* Kartice */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => {
            const ct = categoryText(cat, lang);
            return (
            <Link
              key={cat.slug}
              href={`/katalog/${cat.slug}${selectedCity !== ALL ? `?grad=${encodeURIComponent(selectedCity)}` : ''}`}
              className="katalog-kartica rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer shadow-2xl transition-all duration-300 hover:border-slate-700 bg-gray-900/40 border border-slate-800/80 backdrop-blur-md"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-[#030712]">
                  <RevealImg
                    src={cat.image.replace('w=800', 'w=640')}
                    alt={ct.title}
                    decoding="async"
                    className="w-full h-full object-cover contrast-125 [&.is-loaded]:opacity-50"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent"></div>

                  <div className="absolute top-3 left-3 bg-[#030712]/90 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-slate-800/80 flex items-center gap-1.5 shadow-md">
                    <Icon name={cat.icon} className="h-4 w-4" />
                    <span>{cat.count === 0 ? t.soon : cat.count === 1 ? t.one : t.many(cat.count)}</span>
                  </div>
                </div>

                <div className="p-6 space-y-2 -mt-4 relative z-10">
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {ct.title}
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {ct.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 flex items-center justify-between border-t border-slate-800/60 mt-4">
                <span className="text-[11px] text-slate-400 font-medium">
                  {t.city} {cityLabel(selectedCity)}
                </span>

                <span className="text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors">
                  {t.view}
                </span>
              </div>
            </Link>
            );
          })}
        </div>

        {/* Sve firme */}
        {visible.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {t.firms}{selectedCity !== ALL ? t.inCity(selectedCity) : ""}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((b) => (
                <Link
                  key={b.slug}
                  href={`/katalog/${b.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-gray-900/40 p-4 transition hover:border-blue-500/50"
                >
                  <PartnerLogo slug={b.slug} name={b.name} src={b.logo_url} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white group-hover:text-blue-300">{b.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {(() => { const c = categoryBySlug(b.category); return c ? categoryText(c, lang).short : t.services; })()}
                      {b.city ? ` · ${b.city}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-300">{t.book}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

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