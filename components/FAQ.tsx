"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Šta je POSLO ONE?",
    a: "POSLO ONE je platforma za biznise koja omogućava predstavljanje poslovanja u katalogu, jednostavnije upravljanje rezervacijama i, uz Pro paket, vlastiti dashboard za upravljanje poslovnim informacijama.",
  },
  {
    q: "Kako mogu dodati svoj biznis u POSLO ONE katalog?",
    a: "Prijaviš svoj biznis, dostaviš osnovne informacije o poslovanju i nakon obrade tvoj biznis može biti predstavljen u POSLO ONE katalogu, gdje ga potencijalni klijenti mogu pronaći.",
  },
  {
    q: "Šta dobijam u besplatnom paketu?",
    a: "Besplatni paket omogućava da tvoj biznis bude prisutan u POSLO ONE katalogu i da koristi osnovne funkcionalnosti rezervacija i povezivanja kalendara.",
  },
  {
    q: "Šta dobijam sa Pro paketom?",
    a: "Pro paket ti daje pristup vlastitom dashboardu iz kojeg možeš samostalno upravljati svojim poslovnim informacijama, mijenjati cijene, usluge, radno vrijeme i druge postavke svog biznisa.",
  },
  {
    q: "Kako funkcionišu rezervacije?",
    a: "Klijent odabire uslugu, datum i slobodan termin. Rezervacija se evidentira u sistemu i povezuje s kalendarom biznisa, čime se olakšava organizacija termina i smanjuje mogućnost duplog zakazivanja.",
  },
  {
    q: "Da li POSLO ONE može automatski odgovarati mojim klijentima?",
    a: "Automatsko odgovaranje putem AI-ja nije uključeno u osnovne pakete. Po dogovoru možemo dodatno povezati AI asistenta sa kanalima poput Instagrama, kalendarom i sistemom rezervacija.",
  },
  {
    q: "Mogu li kasnije dodati dodatne funkcije?",
    a: "Da. Dodatne integracije i automatizacije mogu se dogovoriti naknadno, u zavisnosti od potreba tvog biznisa.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-24 px-4 sm:px-8 bg-[#030712] relative"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Često postavljana pitanja
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;

            return (
              <div
                key={index}
                className={`border rounded-2xl transition-all duration-300 overflow-hidden backdrop-blur-md ${
                  isOpen
                    ? "border-blue-500/40 bg-[#080d1c]/90 shadow-lg shadow-blue-500/5"
                    : "border-gray-800 bg-gray-900/40 hover:border-blue-500/20"
                }`}
              >
                <button
                  onClick={() =>
                    setActiveIndex(isOpen ? null : index)
                  }
                  className="w-full p-6 flex justify-between items-center text-left cursor-pointer focus:outline-none"
                >
                  <h3
                    className={`text-base sm:text-lg font-bold pr-4 transition-colors ${
                      isOpen
                        ? "text-blue-400"
                        : "text-white"
                    }`}
                  >
                    {faq.q}
                  </h3>

                  {/* CENTRIRANA + / X ANIMACIJA */}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    <span
                      className={`relative block w-4 h-4 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                    >
                      <span className="absolute left-1/2 top-1/2 h-[2px] w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                      <span className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-gray-800/60 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}