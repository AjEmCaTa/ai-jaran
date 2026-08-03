"use client";

import { useState } from "react";

interface FAQProps {
  t?: any;
}

export default function FAQ({ t }: FAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = t?.items || [
    { 
      q: "Kako AI Jaran uči o mom biznisu?", 
      a: "Tvoj Jaran dobija pristup tvojim cjenovnicima, uslugama i radnom vremenu. Na osnovu toga automatski odgovara klijentima i usklađuje termine." 
    },
    { 
      q: "Da li ja moram ručno odgovarati na poruke?", 
      a: "Ne. Jaran potpuno samostalno vodi razgovor u Instagram DM-u, dogovara termine i upisuje ih direktno u tvoj kalendar bez tvog uplitanja." 
    },
    { 
      q: "Šta se dešava kada se termin zakazuje?", 
      a: "Kada klijent potvrdi termin, Jaran ga upisuje u kalendar, a tebi odmah stiže čista obavijest na mobitel da znaš tačno vrijeme." 
    },
    { 
      q: "Koliko traje podešavanje i puštanje u rad?", 
      a: "Kompletno podešavanje, učenje baze i spajanje sa tvojim kalendarom traje između 2 i 3 radna dana." 
    },
    { 
      q: "Postoje li ikakvi mjesečni troškovi ili pretplate?", 
      a: "Ne. Izrada i postavljanje sistema je jednokratna investicija, čime izbjegavaš bilo kakve mjesečne naknade i komplikacije." 
    },
  ];

  return (
    <section id="faq" className="py-24 px-8 bg-transparent">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-4xl font-extrabold text-white mb-16">
          {typeof t?.titleMain === "string" ? (
            <>
              {t.titleMain}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
                {t.titleHighlight}
              </span>
            </>
          ) : (
            t?.title || "Često postavljana pitanja"
          )}
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq: any, index: number) => {
            const isOpen = activeIndex === index;

            return (
              <div 
                key={index} 
                className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setActiveIndex(isOpen ? null : index)}
                  className="w-full p-6 flex justify-between items-center text-left cursor-pointer"
                >
                  <h3 className="text-lg font-bold text-white pr-4">{faq.q}</h3>
                  <span className="text-2xl text-blue-500 font-light transition-transform duration-200">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed">
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