"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";

// Glavne kategorije biznisa
const businessCategories = [
  {
    id: "dubinsko",
    title: "Dubinsko čišćenje i Autopraonice",
    description: "Sve za vozila i namještaj – dubinsko pranje, autopraonice, detailing i keramička zaštita uz automatsko vođenje termina.",
    icon: "🚗",
    count: "Mreža partnera",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "apartmani",
    title: "Vile i Apartmani",
    description: "Automatsko preuzimanje rezervacija noćenja, komunikacija sa gostima i upiti preko AI asistenta.",
    icon: "🏡",
    count: "Turistički smještaj",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "stanovi",
    title: "Agencije za čišćenje stanova",
    description: "Organizacija i raspored čišćenja stambenih i poslovnih objekata, redovno ili generalno čišćenje.",
    icon: "🧹",
    count: "Usluge čišćenja",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "beauty",
    title: "Frizeri i Beauty Saloni",
    description: "Zakazivanje termina za šišanje, njegu lica, tretmane i kozmetičke usluge bez gužve na telefonu.",
    icon: "💇‍♂️",
    count: "Beauty sektor",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"
  }
];

const cities = ["Svi gradovi", "Mostar", "Sarajevo", "Banja Luka", "Tuzla", "Zenica"];

export default function KatalogPage() {
  const [lang, setLang] = useState<"BS" | "EN">("BS");
  const [selectedCity, setSelectedCity] = useState("Svi gradovi");
  const [activeCategory, setActiveCategory] = useState<any>(null);

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />

      <Navbar 
        lang={lang}
        setLang={setLang}
        brandName="AI Jaran"
        onOpenContact={() => {}} 
        onResetHero={() => {}}
        onOpenCatalog={() => {}}
      />

      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        
        {/* Header sekcija */}
        <div className="text-center mb-12">
          <span className="px-3 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20 uppercase tracking-wider">
            Katalog Biznisa
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent">
            Izaberi djelatnost
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base">
            Pregledaj industrije i sektore za koje AI Jaran pruža automatizaciju i vođenje termina. Izaberi oblast da vidiš dostupne partnere.
          </p>
        </div>

        {/* Izbor lokacije / grada */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <span className="text-sm text-gray-400 font-medium">📍 Filtriraj lokaciju:</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCity === city
                    ? "bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-gray-900/80 text-gray-400 border border-gray-800 hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Prikaz kartica djelatnosti */}
        {!activeCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessCategories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setActiveCategory(cat)}
                className="group bg-gray-900/60 rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-gray-800">
                    <img 
                      src={cat.image} 
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-gray-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-cyan-400 border border-gray-700 flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.count}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-gray-800/60 mt-4 pt-4">
                  <span className="text-xs text-gray-500">Grad: {selectedCity}</span>
                  <span className="text-cyan-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Pregledaj →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Kada je izabrana specifična kategorija */
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
              <div>
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors bg-gray-900 px-4 py-2 rounded-xl border border-gray-800 mb-2"
                >
                  ← Nazad na sve kategorije
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2 mt-2">
                  <span>{activeCategory.icon}</span>
                  <span>{activeCategory.title}</span>
                  <span className="text-xs font-normal text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    Lokacija: {selectedCity}
                  </span>
                </h2>
              </div>
            </div>

            {/* Prazan prostor / Uskoro stižu novi biznisi */}
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">⏳</div>
              <h3 className="text-xl font-bold text-white mb-2">Uskoro stižu novi biznisi!</h3>
              <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                Trenutno proširujemo našu mrežu partnera u ovoj regiji. Ubrzo ovdje dodajemo prve klijente, njihove rasporede i opise usluga!
              </p>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors bg-gray-900 px-6 py-3 rounded-xl border border-gray-800"
          >
            ← Nazad na početnu stranicu
          </a>
        </div>

      </div>

      <Footer 
        t={{
          rights: "Sva prava zadržana.",
          privacy: "Politika privatnosti"
        }} 
        brandName="AI Jaran" 
        onOpenPrivacy={() => {}} 
      />
    </main>
  );
}