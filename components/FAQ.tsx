"use client";

import { useState } from "react";

interface FAQProps {
  t?: any;
}

export default function FAQ({ t }: FAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const defaultFaqs = [
    { 
      q: "Kako AI Jaran uči o mom biznisu?", 
      a: "Tvoj Jaran dobija pristup tvojim cjenovnicima, uslugama i radnom vremenu. Na osnovu toga automatski odgovara klijentima i usklađuje termine." 
    },
    { 
      q: "Da li ja moram ručno odgovarati na poruke?", 
      a: "Ne. Jaran potpuno samostalno vodi razgovor, dogovara termine i upisuje ih direktno u tvoj sistem bez tvog uplitanja." 
    },
    { 
      q: "Šta se dešava kada se termin zakazuje?", 
      a: "Kada klijent potvrdi termin preko kataloga, Jaran ga upisuje u bazu, a tebi stiže jasna obavijest da znaš tačno vrijeme." 
    },
    { 
      q: "Koliko traje podešavanje i puštanje u rad?", 
      a: "Kompletno podešavanje, učenje baze i spajanje sa tvojim uslugama traje u rekordnom roku nakon dogovora." 
    },
    { 
      q: "Šta sve uključuje mjesečna pretplata?", 
      a: "Mjesečna pretplata pokriva kompletno održavanje sSistema, rad AI asistenta 24/7, automatsko vođenje termina i tehničku podršku bez ikakvih skrivenih troškova." 
    },
  ];

  const faqs = t?.items || defaultFaqs;

  return (
    <section id="faq" className="py-24 px-4 sm:px-8 bg-[#030712] relative">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {typeof t?.titleMain === "string" ? (
              <>
                {t.titleMain}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500">
                  {t.titleHighlight}
                </span>
              </>
            ) : (
              t?.title || "Često postavljana pitanja"
            )}
          </h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq: any, index: number) => {
            const isOpen = activeIndex === index;

            return (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-300 overflow-hidden backdrop-blur-md ${
                  isOpen 
                    ? "border-cyan-500/40 bg-gray-900/80 shadow-lg shadow-cyan-500/5" 
                    : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                }`}
              >
                <button
                  onClick={() => setActiveIndex(isOpen ? null : index)}
                  className="w-full p-6 flex justify-between items-center text-left cursor-pointer focus:outline-none"
                >
                  <h3 className={`text-base sm:text-lg font-bold pr-4 transition-colors ${isOpen ? "text-cyan-400" : "text-white"}`}>
                    {faq.q}
                  </h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isOpen ? "bg-cyan-500 text-gray-950 rotate-45" : "bg-gray-800 text-gray-400"
                  }`}>
                    <span className="text-xl font-medium leading-none">+</span>
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