'use client';

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Background from '../../components/Background';
// Ako imaš modal komponentu, uvezi je ovdje, npr:
// import PrivacyModal from '../../components/PrivacyModal';

const businessCategories = [
  {
    id: "dubinsko",
    title: "Dubinsko čišćenje i Autopraonice",
    description: "Sve za vozila i namještaj – dubinsko pranje, autopraonice, detailing i keramička zaštita uz automatsko vođenje termina.",
    icon: "🚗",
    count: "Mreža partnera",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
    slug: "dubinsko-ciscenje",
    city: "Mostar"
  },
  {
    id: "apartmani",
    title: "Vile i Apartmani",
    description: "Automatsko preuzimanje rezervacija noćenja, komunikacija sa gostima i upiti preko AI asistenta.",
    icon: "🏡",
    count: "Turistički smještaj",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    slug: "vile-apartmani",
    city: "Svi gradovi"
  },
  {
    id: "stanovi",
    title: "Agencije za čišćenje stanova",
    description: "Organizacija i raspored čišćenja stambenih i poslovnih objekata, redovno ili generalno čišćenje.",
    icon: "🧹",
    count: "Usluge čišćenja",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    slug: "agencije-za-ciscenje",
    city: "Svi gradovi"
  },
  {
    id: "beauty",
    title: "Frizeri i Beauty Saloni",
    description: "Zakazivanje termina za šišanje, njegu lica, tretmane i kozmetičke usluge bez gužve na telefonu.",
    icon: "💇‍♂️",
    count: "Beauty sektor",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    slug: "beauty-saloni",
    city: "Svi gradovi"
  }
];

const cities = ["Svi gradovi", "Mostar", "Sarajevo", "Banja Luka", "Tuzla", "Zenica"];

export default function KatalogPage() {
  const [selectedCity, setSelectedCity] = useState("Svi gradovi");
  
  // 1. Dodan state za otvaranje politike privatnosti
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />

      <Navbar 
        brandName="AI Jaran"
        onOpenContact={() => {}} 
        onResetHero={() => {}}
        onOpenCatalog={() => {}}
      />

      <div className="pt-36 pb-24 px-4 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="px-3.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-wider inline-block">
            Katalog Biznisa
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Izaberi djelatnost
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Pregledaj industrije i sektore za koje AI Jaran pruža naprednu automatizaciju, upravljanje kalendarima i terminima.
          </p>

          {/* Filter gradova */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-xs text-slate-400 font-medium mr-2">📍 Filtriraj lokaciju:</span>
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

        {/* Kartice sa zagasitim, čistim tonovima */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessCategories.map(cat => (
            <a 
              key={cat.id}
              href={`/katalog/${cat.slug}`}
              className="katalog-kartica rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer shadow-2xl transition-all duration-300 hover:border-slate-700"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-[#030712]">
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover opacity-50 contrast-125" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent"></div>
                  
                  {/* Diskretan bedž u tonu sa sajtom */}
                  <div className="absolute top-3 left-3 bg-[#030712]/90 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-slate-800/80 flex items-center gap-1.5 shadow-md">
                    <span>{cat.icon}</span>
                    <span>{cat.count}</span>
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
      </div>

      {/* 2. Proslijeđena prava funkcija umjesto prazne zagrade */}
      <Footer 
        t={{ rights: "Sva prava zadržana.", privacy: "Politika privatnosti" }} 
        brandName="AI Jaran" 
        onOpenPrivacy={() => setIsPrivacyOpen(true)} 
      />

      {/* 3. Ako imaš modal za privatnost, ovdje ga aktiviraš sa `isPrivacyOpen` */}
      {/* {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} />} */}
    </main>
  );
}