'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import PartnerLogo from '../PartnerLogo';
import RevealImg from '../site/RevealImg';
import { useLang } from '../site/LangProvider';
import { CATALOG_CATEGORIES, categoryBySlug, categoryText } from '../../utils/catalog';
import type { CatalogBusiness } from '../../utils/catalogData';

const ALL = '__all__';

const TEXT = {
  bs: {
    filter: 'Filtriraj lokaciju:', allCities: 'Svi gradovi', soon: 'Uskoro', one: '1 firma', many: (n: number) => `${n} firmi`,
    city: 'Grad:', view: 'Pregledaj →', firms: 'Firme', inCity: (c: string) => ` u gradu ${c}`, services: 'Usluge', book: 'Zakaži →',
    search: 'Traži firmu, uslugu ili grad', noResults: 'Nema firme za tu pretragu. Pogledaj djelatnosti iznad.', categories: 'Djelatnosti',
  },
  en: {
    filter: 'Filter by location:', allCities: 'All cities', soon: 'Coming soon', one: '1 business', many: (n: number) => `${n} businesses`,
    city: 'City:', view: 'View →', firms: 'Businesses', inCity: (c: string) => ` in ${c}`, services: 'Services', book: 'Book →',
    search: 'Search a business, service or city', noResults: 'No business matches that search. See the categories above.', categories: 'Categories',
  },
};

// Isti katalog na stranici Biznisi i na početnoj: isti podaci, iste kategorije, isti linkovi.
// homeLayout: djelatnosti prve, zatim `middle` (npr. video), a firme s pretragom na kraju; na /katalog ostaje stari raspored.
export default function CatalogBrowser({
  businesses: initial,
  retry = false,
  homeLayout = false,
  middle,
}: {
  businesses: CatalogBusiness[];
  retry?: boolean;
  homeLayout?: boolean;
  middle?: React.ReactNode;
}) {
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
  const [selectedCity, setSelectedCity] = useState(ALL);
  const [query, setQuery] = useState('');

  const cities = useMemo(
    () => [ALL, ...Array.from(new Set(businesses.map((b) => b.city.trim()).filter(Boolean))).sort((x, y) => x.localeCompare(y, 'bs'))],
    [businesses]
  );
  const visible = useMemo(
    () => (selectedCity === ALL ? businesses : businesses.filter((b) => b.city.trim() === selectedCity)),
    [businesses, selectedCity]
  );
  // Pretraga samo filtrira prikaz (naziv, djelatnost, grad); podaci se ne mijenjaju.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((b) => {
      const c = categoryBySlug(b.category);
      const hay = [b.name, b.city, c ? categoryText(c, 'bs').title : '', c ? categoryText(c, 'en').title : ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [visible, query]);
  const categories = useMemo(
    () =>
      CATALOG_CATEGORIES.map((c) => ({ ...c, count: visible.filter((b) => b.category === c.slug).length }))
        .filter((c) => c.slug !== 'ostale-usluge' || c.count > 0)
        .sort((x, y) => y.count - x.count),
    [visible]
  );
  const cityLabel = (city: string) => (city === ALL ? t.allCities : city);

  const cityFilter = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="mr-2 text-xs font-medium text-slate-400">
        <Icon name="mapPin" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />{t.filter}
      </span>
      {cities.map((city) => (
        <button
          key={city}
          onClick={() => setSelectedCity(city)}
          className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
            selectedCity === city
              ? 'border-blue-500 bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20'
              : 'border-slate-800 bg-[#030712] text-slate-300 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          {cityLabel(city)}
        </button>
      ))}
    </div>
  );

  const categoryCards = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat) => {
        const ct = categoryText(cat, lang);
        return (
          <Link
            key={cat.slug}
            href={`/katalog/${cat.slug}${selectedCity !== ALL ? `?grad=${encodeURIComponent(selectedCity)}` : ''}`}
            className="katalog-kartica flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-800/80 bg-gray-900/40 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-700"
          >
            <div>
              <div className="relative h-48 overflow-hidden bg-[#030712]">
                <RevealImg
                  src={cat.image.replace('w=800', 'w=640')}
                  alt={ct.title}
                  decoding="async"
                  className="h-full w-full object-cover contrast-125 [&.is-loaded]:opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent"></div>
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-slate-800/80 bg-[#030712]/90 px-3 py-1 text-xs font-medium text-slate-300 shadow-md">
                  <Icon name={cat.icon} className="h-4 w-4" />
                  <span>{cat.count === 0 ? t.soon : cat.count === 1 ? t.one : t.many(cat.count)}</span>
                </div>
              </div>
              <div className="relative z-10 -mt-4 space-y-2 p-6">
                <h3 className="text-lg font-bold leading-snug text-white">{ct.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{ct.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 px-6 pb-6 pt-4">
              <span className="text-[11px] font-medium text-slate-400">
                {t.city} {cityLabel(selectedCity)}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-300 transition-colors hover:text-white">{t.view}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const firmList = (list: CatalogBusiness[]) => (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((b) => (
        <Link
          key={b.slug}
          href={`/katalog/${b.slug}`}
          className="group flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-gray-900/40 p-4 transition hover:border-blue-500/50"
        >
          <PartnerLogo slug={b.slug} name={b.name} src={b.logo_url} className="h-14 w-14" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white group-hover:text-blue-300">{b.name}</p>
            <p className="truncate text-xs text-slate-400">
              {(() => {
                const c = categoryBySlug(b.category);
                return c ? categoryText(c, lang).short : t.services;
              })()}
              {b.city ? ` · ${b.city}` : ''}
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-300">{t.book}</span>
        </Link>
      ))}
    </div>
  );

  if (homeLayout) {
    return (
      <div>
        {cities.length > 2 && <div className="mb-6">{cityFilter}</div>}
        <h2 id="djelatnosti" className="mb-6 scroll-mt-28 text-2xl font-bold tracking-tight text-white">{t.categories}</h2>
        {categoryCards}

        {middle}

        <div id="firme" className="scroll-mt-28 mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t.firms}{selectedCity !== ALL ? t.inCity(selectedCity) : ''}
          </h2>
          <label className="relative mt-5 block max-w-xl">
            <span className="sr-only">{t.search}</span>
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-base text-white placeholder-slate-500 backdrop-blur transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          {searched.length > 0 ? firmList(searched) : <p className="mt-4 text-sm text-slate-400">{t.noResults}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto -mt-8 mb-12 max-w-3xl pt-4">{cityFilter}</div>
      {categoryCards}
      {visible.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t.firms}{selectedCity !== ALL ? t.inCity(selectedCity) : ''}
          </h2>
          {firmList(visible)}
        </div>
      )}
    </div>
  );
}
