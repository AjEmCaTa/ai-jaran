"use client";

interface HeroProps {
  onStartFree: () => void;
  onCatalogJoin?: () => void;
  onHowItWorks?: () => void;
  animationKey?: number;
}

const benefits = ["30 dana besplatno", "Postavimo sve za tebe", "Od 15 KM mjesečno"];

export default function Hero({ onStartFree, onHowItWorks, animationKey }: HeroProps) {
  return (
    <section
      key={animationKey}
      id="početna"
      className="relative overflow-hidden bg-[#030712] pt-[82px] lg:min-h-screen lg:pt-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[35%] top-[15%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[140px]" />
        <div className="absolute right-[-150px] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1500px] items-center px-5 pb-10 pt-6 sm:px-10 sm:py-12 lg:min-h-[calc(100vh-96px)] lg:py-16 lg:px-14 xl:px-20">
        <div className="grid w-full items-center gap-8 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 xl:gap-16">

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-3 py-1.5 sm:mb-7 sm:px-4 sm:py-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-300 sm:text-xs sm:tracking-[0.16em]">
                Online zakazivanje za male firme
              </span>
            </div>

            <h1 className="text-[2.75rem] font-extrabold leading-[0.98] text-white sm:text-7xl lg:text-[5rem] xl:text-[5.8rem]">
              Manje poziva.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Više termina.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-6 text-slate-300 sm:mt-7 sm:text-lg sm:leading-8">
              Klijenti sami zakazuju preko tvoje stranice, a ti odmah dobiješ obavijest.
              Bez poruka u 11 navečer i bez duplih termina.
            </p>

            <p className="mt-2 max-w-xl text-[13px] leading-5 text-slate-400 sm:mt-3 sm:text-base">
              Za salone, servise, autopraonice i sve koji rade po terminima.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-9 sm:flex-row sm:gap-3">
              <button
                onClick={onStartFree}
                className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-[0_15px_45px_rgba(37,99,235,0.25)] transition hover:bg-blue-500 cursor-pointer sm:py-4"
              >
                Probaj 30 dana besplatno
                <span className="text-xl font-bold">→</span>
              </button>
              <button
                onClick={onHowItWorks}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-7 py-3 font-semibold text-white transition hover:bg-white/[0.07] cursor-pointer sm:py-4"
              >
                Pogledaj kako radi
              </button>
            </div>
            <a href="/demo" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 underline-offset-4 transition hover:text-blue-200 hover:underline">
              Isprobaj demo stranicu kao klijent →
            </a>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.07] pt-4 sm:mt-11 sm:gap-x-7 sm:gap-y-4 sm:pt-7">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-[13px] text-slate-300 sm:gap-2 sm:text-sm">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-[10px] text-blue-400 sm:h-5 sm:w-5 sm:text-xs">
                    ✓
                  </span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Pravi prikaz proizvoda */}
          <div className="relative flex items-center justify-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.14] blur-[110px]" />
            <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]">
              <div className="overflow-hidden rounded-[30px] border border-blue-400/25 bg-[#020617] p-1.5 shadow-[0_0_80px_rgba(37,99,235,0.18)] sm:rounded-[36px] sm:p-2">
                <video
                  className="block aspect-[540/844] w-full rounded-[24px] object-cover sm:rounded-[28px]"
                  src="/video/poslo-one-demo.mp4"
                  poster="/video/poslo-one-demo-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Kako klijent zakaže termin preko POSLO ONE"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
