"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";

export default function CjenovnikPage() {
  const [lang, setLang] = useState<"BS" | "EN">("BS");

  // Funkcija koja vodi na kontakt formu i prosljeđuje odabrani paket
  const handleSelectPlan = (planName: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selected_plan", planName);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white selection:bg-blue-600 selection:text-white">
      <Navbar 
        onOpenContact={() => {}} 
        onResetHero={() => window.location.href = "/"} 
        brandName="AI Jaran" 
        lang={lang} 
        setLang={setLang}
      />
      
      <section className="pt-32 pb-20 px-6 sm:px-8 text-center relative overflow-hidden">
        {/* Pozadinski sjaj */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* DUGME ZA POVRATAK NA POČETNU */}
          <div className="mb-8 flex justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
            >
              <span>←</span> {lang === "BS" ? "Nazad na početnu" : "Back to home"}
            </Link>
          </div>

          <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider mb-4 block">
            {lang === "BS" ? "Jednostavni i transparentni paketi" : "Simple and transparent packages"}
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            {lang === "BS" ? "Počni sa svim Pro mogućnostima. Odluči kasnije." : "Start with all Pro features. Decide later."}
          </h1>
          
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            {lang === "BS" 
              ? "Bez kartice, bez automatske naplate i bez skrivenih troškova. Uplate se vrše po dogovoru direktno." 
              : "No card, no automatic billing, and no hidden fees. Payments are made directly by agreement."}
          </p>

          {/* KARTICE CJENOVNIKA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Free / Starter Kartica */}
            <div className="rounded-[32px] border border-slate-800 bg-[#080d1c] p-8 sm:p-10 flex flex-col justify-between shadow-xl relative">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">0 KM</span>
                  <span className="text-slate-400">{lang === "BS" ? "zauvijek" : "forever"}</span>
                </div>
                <p className="text-slate-300 text-sm mb-8">
                  {lang === "BS" ? "Idealno za testiranje i manje potrebe vašeg biznisa." : "Ideal for testing and smaller business needs."}
                </p>
                <ul className="space-y-4 text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Osnovni AI asistenti" : "Basic AI assistants"}</li>
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Standardna podrška" : "Standard support"}</li>
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Pristup katalogu" : "Catalog access"}</li>
                </ul>
              </div>
              <Link
                href="/?contact=true&plan=starter"
                onClick={() => handleSelectPlan("Starter")}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-700 bg-transparent py-4 font-semibold text-white transition-all hover:bg-slate-800 cursor-pointer"
              >
                {lang === "BS" ? "Izaberi Starter" : "Choose Starter"}
              </Link>
            </div>

            {/* Pro Kartica */}
            <div className="rounded-[32px] border border-blue-500/50 bg-gradient-to-b from-[#080d1c] to-[#040814] p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                {lang === "BS" ? "PREPORUČENO" : "RECOMMENDED"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Jaran Pro</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">50 KM</span>
                  <span className="text-slate-400">/{lang === "BS" ? "mjesečno" : "month"}</span>
                </div>
                <p className="text-slate-300 text-sm mb-8">
                  {lang === "BS" ? "Za biznise koji žele maksimalnu efikasnost i napredne AI funkcije." : "For businesses wanting maximum efficiency and advanced AI features."}
                </p>
                <ul className="space-y-4 text-sm text-slate-200 mb-8">
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Sve prednosti Starter paketa" : "All Starter benefits"}</li>
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Neograničene poruke i upiti" : "Unlimited messages & inquiries"}</li>
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Prioritetna podrška 24/7" : "Priority 24/7 support"}</li>
                  <li className="flex items-center gap-3">✓ {lang === "BS" ? "Direktna integracija i setup" : "Direct integration & setup"}</li>
                </ul>
              </div>
              <Link
                href="/?contact=true&plan=pro"
                onClick={() => handleSelectPlan("Jaran Pro (50 KM)")}
                className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:scale-[1.01] cursor-pointer"
              >
                {lang === "BS" ? "Zatraži Pro pristup" : "Request Pro access"}
              </Link>
            </div>

          </div>

          {/* DETALJNA TABELA UPOREDBE */}
          <div className="mt-24 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              {lang === "BS" ? "Detaljna uporedba paketa" : "Detailed plan comparison"}
            </h2>

            <div className="rounded-3xl border border-white/10 bg-[#080d1c] overflow-hidden shadow-xl">
              <div className="grid grid-cols-3 p-6 border-b border-white/10 bg-white/[0.02] font-bold text-sm sm:text-base">
                <div>{lang === "BS" ? "Mogućnost" : "Feature"}</div>
                <div className="text-center">Starter</div>
                <div className="text-center text-blue-400">Jaran Pro</div>
              </div>

              <div className="divide-y divide-white/5 text-sm text-slate-300">
                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">{lang === "BS" ? "Cijena" : "Price"}</div>
                  <div className="text-center text-slate-400">0 KM</div>
                  <div className="text-center font-bold text-blue-400">50 KM / mj</div>
                </div>

                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">{lang === "BS" ? "AI Asistent za poruke" : "AI Message Assistant"}</div>
                  <div className="text-center">Ograničeno</div>
                  <div className="text-center text-blue-400">Neograničeno</div>
                </div>

                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">{lang === "BS" ? "Katalog usluga i ponuda" : "Catalog & offers"}</div>
                  <div className="text-center">Osnovno</div>
                  <div className="text-center text-blue-400">Napredno + Istaknuto</div>
                </div>

                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">{lang === "BS" ? "Podrška" : "Support"}</div>
                  <div className="text-center">Standardna</div>
                  <div className="text-center text-blue-400">24/7 Prioritetna</div>
                </div>

                <div className="grid grid-cols-3 p-6 items-center">
                  <div className="font-medium text-white">{lang === "BS" ? "Prilagođavanje i podešavanje" : "Customization & Setup"}</div>
                  <div className="text-center text-slate-500">—</div>
                  <div className="text-center text-blue-400">Uključeno</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer 
        t={{ rights: lang === "BS" ? "Sva prava zadržana." : "All rights reserved." }} 
        brandName="AI Jaran" 
        onOpenPrivacy={() => {}} 
      />
    </main>
  );
}