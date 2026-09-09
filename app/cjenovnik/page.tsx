'use client';

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Background from '../../components/Background';
import ContactModal from '../../components/ContactModal';
import PrivacyModal from '../../components/PrivacyModal';

export default function CjenovnikPage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(
    "Opšta pitanja / Konsultacije"
  );

  const openContact = (
    planName: string = "Opšta pitanja / Konsultacije"
  ) => {
    setSelectedPlan(planName);
    setIsContactOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white selection:bg-blue-600 selection:text-white">
      <Navbar
        onOpenContact={() => {
          openContact("Opšta pitanja / Konsultacije");
        }}
        onResetHero={() => {
          window.location.href = "/";
        }}
        onOpenCatalog={() => {
          window.location.href = "/katalog";
        }}
      />

      <section className="pt-32 pb-20 px-6 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* DUGME ZA POVRATAK NA POČETNU */}
          <div className="mb-8 flex justify-start">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
            >
              <span>←</span> Nazad na početnu
            </button>
          </div>

          {/* NASLOV */}
          <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-4 block">
            Jednostavni i transparentni paketi
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Izaberi paket koji odgovara tvom biznisu.
          </h1>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            Započni sa 30 dana besplatnog korištenja, predstavi svoj biznis u
            katalogu i koristi osnovne funkcije rezervacija. Kada ti zatreba
            više kontrole, pređi na Pro paket.
          </p>

          {/* KARTICE CJENOVNIKA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">

            {/* STARTER */}
            <div className="rounded-[32px] border border-slate-800 bg-[#080d1c] p-8 sm:p-10 flex flex-col justify-between shadow-xl relative">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Starter
                </h3>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">
                    15 KM
                  </span>
                  <span className="text-slate-400">
                    / mjesečno
                  </span>
                </div>

                <p className="text-slate-300 text-sm mb-8">
                  Osnovno prisustvo tvog biznisa u POSLO ONE sistemu,
                  uz 30 dana besplatnog korištenja.
                </p>

                <ul className="space-y-4 text-sm text-slate-300 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Prisustvo u POSLO ONE katalogu</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Osnovni profil biznisa</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Osnovne funkcije rezervacija</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Povezivanje sa kalendarom</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>30 dana besplatno</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => openContact("Starter")}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-700 bg-transparent py-4 font-semibold text-white transition-all hover:bg-slate-800 cursor-pointer"
              >
                Dodaj svoj biznis
              </button>
            </div>

            {/* PRO */}
            <div className="rounded-[32px] border border-blue-500/50 bg-gradient-to-b from-[#080d1c] to-[#040814] p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">

              <div className="absolute top-4 right-4 bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                PREPORUČENO
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  POSLO ONE Pro
                </h3>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">
                    50 KM
                  </span>
                  <span className="text-slate-400">
                    / mjesečno
                  </span>
                </div>

                <p className="text-slate-300 text-sm mb-8">
                  Za biznise koji žele potpunu kontrolu nad svojim
                  profilom, uslugama, cijenama i radnim vremenom.
                </p>

                <ul className="space-y-4 text-sm text-slate-200 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Sve iz Starter paketa</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Vlastiti poslovni dashboard</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Samostalno uređivanje cijena i usluga</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Upravljanje radnim vremenom i terminima</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Naprednije upravljanje poslovnim profilom</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>Prioritetna podrška</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">✓</span>
                    <span>30 dana besplatno</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => openContact("POSLO ONE Pro (50 KM)")}
                className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:scale-[1.01] cursor-pointer"
              >
                Zatraži Pro pristup
              </button>
            </div>
          </div>

          {/* DODATNE OPCIJE */}
          <div className="mt-16 rounded-3xl border border-blue-500/15 bg-[#080d1c]/60 p-8 text-left backdrop-blur-xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">
                Potrebno ti je više?
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed text-center">
                POSLO ONE se može dodatno prilagoditi potrebama tvog
                biznisa. Po dogovoru možemo povezati dodatne kanale
                komunikacije, automatizacije, AI asistenta, Instagram,
                kalendar i druge poslovne alate.
              </p>

              <p className="mt-4 text-slate-400 text-sm text-center">
                Dodatne funkcije nisu uključene u osnovne pakete i
                dogovaraju se zasebno prema potrebama biznisa.
              </p>
            </div>
          </div>

          {/* DETALJNA TABELA UPOREDBE */}
          <div className="mt-24 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              Detaljna uporedba paketa
            </h2>

            <div className="rounded-3xl border border-white/10 bg-[#080d1c] overflow-hidden shadow-xl">

              <div className="grid grid-cols-3 p-6 border-b border-white/10 bg-white/[0.02] font-bold text-sm sm:text-base">
                <div>Mogućnost</div>

                <div className="text-center">
                  Starter
                </div>

                <div className="text-center text-blue-400">
                  POSLO ONE Pro
                </div>
              </div>

              <div className="divide-y divide-white/5 text-sm text-slate-300">

                {/* CIJENA */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Cijena
                  </div>

                  <div className="text-center text-slate-400">
                    15 KM / mj
                  </div>

                  <div className="text-center font-bold text-blue-400">
                    50 KM / mj
                  </div>
                </div>

                {/* KATALOG */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Katalog biznisa
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>
                </div>

                {/* REZERVACIJE */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Rezervacije i kalendar
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>
                </div>

                {/* DASHBOARD */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Vlastiti dashboard
                  </div>

                  <div className="text-center text-slate-500">
                    —
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>
                </div>

                {/* UREĐIVANJE CIJENA */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Uređivanje cijena i usluga
                  </div>

                  <div className="text-center text-slate-500">
                    —
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>
                </div>

                {/* RADNO VRIJEME */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Upravljanje radnim vremenom
                  </div>

                  <div className="text-center text-slate-500">
                    —
                  </div>

                  <div className="text-center text-blue-400">
                    ✓
                  </div>
                </div>

                {/* POSLOVNI PROFIL */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Upravljanje poslovnim profilom
                  </div>

                  <div className="text-center">
                    Osnovno
                  </div>

                  <div className="text-center text-blue-400">
                    Napredno
                  </div>
                </div>

                {/* AI */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    AI odgovaranje klijentima
                  </div>

                  <div className="text-center text-slate-500">
                    —
                  </div>

                  <div className="text-center text-slate-400">
                    Dodatna opcija
                  </div>
                </div>

                {/* DODATNE INTEGRACIJE */}
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">
                    Dodatne integracije
                  </div>

                  <div className="text-center text-slate-500">
                    —
                  </div>

                  <div className="text-center text-slate-400">
                    Po dogovoru
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* NAPOMENA O PLAĆANJU */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Prvih 30 dana je besplatno za oba paketa. Nakon toga se
              naplaćuje odabrani paket. Bez skrivenih troškova.
              Način plaćanja i detalji aktivacije dogovaraju se direktno.
            </p>
          </div>

        </div>
      </section>

      <Footer
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultSubject={selectedPlan}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </main>
  );
}