"use client";

import { useState } from "react";
import { useT } from "./site/LangProvider";

const FAQS_EN = [
  {
    q: "What is POSLO ONE?",
    a: "POSLO ONE is online appointment booking for small businesses. Your clients choose a service and a free slot on your page themselves, and you get notified and see everything in your panel.",
  },
  {
    q: "How can I add my business to the POSLO ONE catalog?",
    a: "Sign up your business and send us some basic information. Once it's processed, your business can be listed in the POSLO ONE catalog, where potential clients can find it.",
  },
  {
    q: "How much does it cost?",
    a: "Starter is 15 KM and Pro is 50 KM per month. The first 30 days are free on both plans, and we set up your page for you.",
  },
  {
    q: "What do I get with the Pro plan?",
    a: "Pro gives you your own dashboard where you can manage your business information yourself: prices, services, working hours and other settings.",
  },
  {
    q: "How do bookings work?",
    a: "The client picks a service, a date and a free slot. The booking is saved in the system and linked to the business calendar, which makes scheduling easier and prevents double bookings.",
  },
  {
    q: "Can POSLO ONE reply to my clients automatically?",
    a: "Automatic AI replies are not included in the basic plans. By arrangement, we can connect an AI assistant to channels like Instagram, your calendar and the booking system.",
  },
  {
    q: "Can I add more features later?",
    a: "Yes. Extra integrations and automations can be arranged later, depending on what your business needs.",
  },
];

const FAQS_BS = [
  {
    q: "Šta je POSLO ONE?",
    a: "POSLO ONE je online zakazivanje termina za male firme. Tvoji klijenti preko tvoje stranice sami biraju uslugu i slobodan termin, a ti dobiješ obavijest i sve vidiš u svom panelu.",
  },
  {
    q: "Kako mogu dodati svoj biznis u POSLO ONE katalog?",
    a: "Prijaviš svoj biznis, dostaviš osnovne informacije o poslovanju i nakon obrade tvoj biznis može biti predstavljen u POSLO ONE katalogu, gdje ga potencijalni klijenti mogu pronaći.",
  },
  {
    q: "Koliko košta?",
    a: "Starter je 15 KM, a Pro 50 KM mjesečno. Prvih 30 dana je besplatno za oba paketa, a stranicu ti postavimo mi.",
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
  const t = useT({ bs: { title: "Često postavljana pitanja", faqs: FAQS_BS }, en: { title: "Frequently asked questions", faqs: FAQS_EN } });

  return (
    <section
      id="faq"
      className="py-10 px-4 sm:py-24 sm:px-8 bg-[#030712] relative"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {t.title}
          </h2>
        </div>

        <div className="space-y-4">
          {t.faqs.map((faq, index) => {
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
                  aria-expanded={isOpen}
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

                {/* Odgovor se glatko otvori i zatvori. */}
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-gray-800/60 pt-4">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}