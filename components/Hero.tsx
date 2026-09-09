"use client";

import { useState } from "react";

interface HeroProps {
  onStartFree: () => void;
  onCatalogJoin?: () => void;
  onHowItWorks?: () => void;
  animationKey?: number;
}

export default function Hero({
  onStartFree,
  animationKey,
}: HeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section
      key={animationKey}
      id="početna"
      className="relative min-h-screen overflow-hidden bg-[#030712] pt-24"
    >
      {/* POZADINSKO SVJETLO */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[35%] top-[15%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[140px]" />
        <div className="absolute right-[-150px] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-[1500px] items-center px-6 py-16 sm:px-10 lg:px-14 xl:px-20">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 xl:gap-16">

          {/* LIJEVA STRANA */}
          <div className="max-w-2xl">

            {/* BADGE */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-4 py-2 backdrop-blur-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                DIGITALNI ASISTENT ZA TVOJE POSLOVANJE
              </span>
            </div>

            {/* NASLOV */}
            <h1 className="text-[3.4rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5.2rem]">
              Poslovanje koje
              <br />

              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
                radi za tebe.
              </span>
            </h1>

            {/* OPIS */}
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              POSLO ONE automatizuje rezervacije, komunikaciju s klijentima i
              svakodnevne poslovne zadatke — sve na jednom mjestu.
            </p>

            {/* DUGMAD */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onStartFree}
                className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-[0_15px_45px_rgba(37,99,235,0.25)] transition hover:bg-blue-500 cursor-pointer"
              >
                Započni besplatno
                <span className="text-2xl font-bold">→</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.07] cursor-pointer"
              >
                Kako radi?
              </button>
            </div>

            {/* BENEFITI */}
            <div className="mt-11 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/[0.07] pt-7">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                  ✓
                </span>
                Automatski odgovori
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                  ✓
                </span>
                Pomoć u poslovanju
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                  ✓
                </span>
                Dostupan 24/7
              </div>
            </div>
          </div>

          {/* DESNA STRANA */}
          <div className="relative flex items-center justify-center lg:min-h-[600px]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.12] blur-[120px]" />

            <div className="relative z-10 w-full max-w-[620px]">
              <div className="relative overflow-hidden rounded-[32px] border border-blue-400/20 bg-[#020617]/70 p-2 shadow-[0_0_80px_rgba(37,99,235,0.12)]">
                <div className="relative overflow-hidden rounded-[25px]">
                  <img
                    src="/hero-ai-jaran.png"
                    alt="POSLO ONE – digitalno poslovanje"
                    className="block h-auto w-full object-cover"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617]/20 via-transparent to-blue-500/[0.03]" />
                </div>
              </div>

              <div className="absolute -right-4 top-10 hidden rounded-2xl border border-blue-400/15 bg-[#080d1c]/95 px-4 py-3 shadow-2xl backdrop-blur-xl sm:block">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />

                  <span className="text-xs font-medium text-slate-300">
                    Online
                  </span>
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
              Kako funkcioniše POSLO ONE?
            </h3>

            <div className="space-y-4 text-sm text-slate-300 mb-6">
              <div className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                  1
                </div>

                <p>
                  <strong className="text-white">Odabir opcije:</strong>{" "}
                  Izaberi paket koji odgovara tvom biznisu.
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                  2
                </div>

                <p>
                  <strong className="text-white">Podešavanje:</strong>{" "}
                  Unesi podatke o uslugama, radnom vremenu i cijenama.
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                  3
                </div>

                <p>
                  <strong className="text-white">Automatizacija:</strong>{" "}
                  POSLO ONE odgovara klijentima 24/7 i pomaže u vođenju
                  poslovanja.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsModalOpen(false);
                onStartFree();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-lg cursor-pointer"
            >
              Isprobaj odmah
            </button>
          </div>
        </div>
      )}
    </section>
  );
}