"use client";

import { useState } from "react";

interface HeroProps {
  onStartFree: () => void;
  onCatalogJoin?: () => void;
  onHowItWorks?: () => void;
  animationKey?: number;
  lang?: "BS" | "EN";
  t: {
    badge: string;
    titleMain: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    catalogCta?: string;
  };
}

export default function Hero({
  onStartFree,
  animationKey,
  lang = "BS",
  t,
}: HeroProps) {
  // Lokalno stanje za otvaranje modala
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section
      key={animationKey}
      id="početna"
      className="relative min-h-screen overflow-hidden bg-[#030712] pt-24"
    >
      {/* POZADINSKO SVJETLO */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[50%] top-[15%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[140px]" />
        <div className="absolute right-[-150px] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
      </div>

      {/* SUPTILNA MREŽA */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "70px 70px",
        }}
      />

      {/* GLAVNI SADRŽAJ */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-[1500px] items-center px-6 py-16 sm:px-10 lg:px-14 xl:px-20">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 xl:gap-16">

          {/* LIJEVA STRANA */}
          <div className="max-w-2xl">

            {/* BADGE */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-4 py-2 backdrop-blur-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                {t.badge}
              </span>
            </div>

            {/* NASLOV */}
            <h1 className="text-[3.4rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[4.7rem] xl:text-[5.4rem]">
              {t.titleMain}
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
            </h1>

            {/* OPIS */}
            <p className="mt-8 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {t.description}
            </p>

            {/* DUGMAD */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onStartFree}
                className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-[0_15px_45px_rgba(37,99,235,0.25)] transition hover:bg-blue-500 cursor-pointer"
              >
                {t.ctaPrimary}
                <span className="text-2xl font-bold">→</span>
              </button>

              {/* DIREKTNO OTVARANJE MODALA */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.07] cursor-pointer"
              >
                {t.ctaSecondary}
              </button>
            </div>

            {/* BENEFITI */}
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/[0.07] pt-7">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                  ✓
                </span>
                {lang === "BS" ? "Automatski odgovori" : "Automatic responses"}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                  ✓
                </span>
                {lang === "BS" ? "Pomoć u poslovanju" : "Business assistance"}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                  ✓
                </span>
                {lang === "BS" ? "Dostupan 24/7" : "Available 24/7"}
              </div>
            </div>
          </div>

          {/* DESNA STRANA */}
          <div className="relative flex items-center justify-center lg:min-h-[650px]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.14] blur-[120px]" />

            <div className="relative z-10 w-full max-w-[680px]">
              <div className="relative overflow-hidden rounded-[32px] border border-blue-400/20 bg-[#020617]/70 p-2 shadow-[0_0_80px_rgba(37,99,235,0.12)]">
                <div className="relative overflow-hidden rounded-[25px]">
                  <img
                    src="/hero-ai-jaran.png"
                    alt="AI Jaran – AI asistent za poslovanje"
                    className="block h-auto w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617]/20 via-transparent to-blue-500/[0.03]" />
                </div>
              </div>

              <div className="absolute -right-4 top-10 hidden rounded-2xl border border-blue-400/15 bg-[#080d1c]/95 px-4 py-3 shadow-2xl backdrop-blur-xl sm:block">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-slate-300">Online</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL ZA "KAKO RADI?" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/50" 
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#030712] p-6 md:p-8 shadow-2xl z-10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              {lang === "BS" ? "Kako funkcioniše AI Jaran?" : "How AI Jaran works"}
            </h3>

            <div className="space-y-4 text-sm text-slate-300 mb-6">
              <div className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">1</div>
                <p><strong className="text-white">Odabir opcije:</strong> Izaberi besplatni starter ili pro paket za tvoj biznis.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">2</div>
                <p><strong className="text-white">Podešavanje:</strong> Unesi podatke o uslugama, radnom vremenu i cijenama.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">3</div>
                <p><strong className="text-white">Automatizacija:</strong> AI Jaran odgovara klijentima 24/7 i vodi katalog biznisa.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsModalOpen(false);
                onStartFree();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-lg cursor-pointer"
            >
              {lang === "BS" ? "Isprobaj odmah" : "Try it now"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}