'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Background from '../../components/Background';
import ContactModal from '../../components/ContactModal';
import PrivacyModal from '../../components/PrivacyModal';
import Icon from '../../components/Icon';
import PartnerLogo from '../../components/PartnerLogo';
import { CATALOG_CATEGORIES, categoryBySlug } from '../../utils/catalog';

type CatalogBusiness = { slug: string; name: string; city: string; category: string; logo_url: string };

export default function KatalogPage() {
  const [selectedCity, setSelectedCity] = useState("Svi gradovi");
  const [businesses, setBusinesses] = useState<CatalogBusiness[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((json) => setBusinesses(Array.isArray(json.businesses) ? json.businesses : []))
      .catch(() => setBusinesses([]))
      .finally(() => setLoaded(true));
  }, []);

  const cities = useMemo(
    () => ["Svi gradovi", ...Array.from(new Set(businesses.map((b) => b.city.trim()).filter(Boolean))).sort((x, y) => x.localeCompare(y, "bs"))],
    [businesses]
  );
  const visible = useMemo(
    () => (selectedCity === "Svi gradovi" ? businesses : businesses.filter((b) => b.city.trim() === selectedCity)),
    [businesses, selectedCity]
  );
  const categories = useMemo(
    () =>
      CATALOG_CATEGORIES.map((c) => ({ ...c, count: visible.filter((b) => b.category === c.slug).length }))
        .filter((c) => c.slug !== "ostale-usluge" || c.count > 0)
        .sort((x, y) => y.count - x.count),
    [visible]
  );
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />

      <Navbar
        onOpenContact={() => setIsContactOpen(true)}
        onResetHero={() => {}}
        onOpenCatalog={() => {}}
      />

      <div className="pt-28 pb-16 px-4 sm:pt-36 sm:pb-24 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="px-3.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-wider inline-block">
            Katalog Biznisa
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Izaberi djelatnost
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Pregledaj industrije i sektore za koje POSLO ONE pruža napredne
            mogućnosti upravljanja poslovanjem, rezervacijama i terminima.
          </p>

          {/* Filter gradova */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-xs text-slate-400 font-medium mr-2">
              <Icon name="mapPin" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />Filtriraj lokaciju:
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
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Kartice */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <a
              key={cat.slug}
              href={`/katalog/${cat.slug}${selectedCity !== 'Svi gradovi' ? `?grad=${encodeURIComponent(selectedCity)}` : ''}`}
              className="katalog-kartica rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer shadow-2xl transition-all duration-300 hover:border-slate-700 bg-gray-900/40 border border-slate-800/80 backdrop-blur-md"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-[#030712]">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover opacity-50 contrast-125"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent"></div>

                  <div className="absolute top-3 left-3 bg-[#030712]/90 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-slate-800/80 flex items-center gap-1.5 shadow-md">
                    <Icon name={cat.icon} className="h-4 w-4" />
                    <span>{!loaded ? '...' : cat.count === 0 ? 'Uskoro' : cat.count === 1 ? '1 firma' : `${cat.count} firmi`}</span>
                  </div>
                </div>

                <div className="p-6 space-y-2 -mt-4 relative z-10">
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {cat.title}
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 flex items-center justify-between border-t border-slate-800/60 mt-4">
                <span className="text-[11px] text-slate-400 font-medium">
                  Grad: {selectedCity}
                </span>

                <span className="text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors">
                  Pregledaj →
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Sve firme */}
        {visible.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Firme{selectedCity !== "Svi gradovi" ? ` u gradu ${selectedCity}` : ""}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((b) => (
                <a
                  key={b.slug}
                  href={`/katalog/${b.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-gray-900/40 p-4 transition hover:border-blue-500/50"
                >
                  <PartnerLogo slug={b.slug} name={b.name} src={b.logo_url} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white group-hover:text-blue-300">{b.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {categoryBySlug(b.category)?.short || "Usluge"}
                      {b.city ? ` · ${b.city}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-300">Zakaži →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sekcija za prijavu biznisa */}
        <div className="mt-16 bg-gray-900/40 border border-slate-800/80 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-wider inline-block">
              Budi dio mreže
            </span>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Želiš i svoj biznis u POSLO ONE katalogu?
            </h2>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Predstavi svoj biznis na POSLO ONE platformi i omogući klijentima
              jednostavan pristup informacijama, rezervacijama i terminima.
              Kontaktiraj nas i dogovorit ćemo sve detalje.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setIsContactOpen(true)}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
              >
                <Icon name="mail" className="h-4 w-4" /> Želim svoj biznis u katalogu
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultSubject="Prijava biznisa u katalog"
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </main>
  );
}