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
      {/* POZADINSKO SVJETLO */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[35%] top-[15%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[140px]" />
        <div className="absolute right-[-150px] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.07] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1500px] items-center px-6 py-8 sm:px-10 sm:py-12 lg:min-h-[calc(100vh-96px)] lg:py-16 lg:px-14 xl:px-20">
        <div className="grid w-full items-center gap-10 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 xl:gap-16">

          {/* LIJEVA STRANA */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-3.5 py-1.5 backdrop-blur-xl sm:mb-7 sm:px-4 sm:py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-300 sm:text-xs sm:tracking-[0.16em]">
                Online zakazivanje termina za male firme u BiH
              </span>
            </div>

            <h1 className="text-[clamp(2rem,9.6vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[4.3rem] xl:text-[5rem]">
              Klijenti zakazuju sami.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
                Ti radiš svoj posao.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:mt-7 sm:text-lg sm:leading-8">
              Tvoja stranica za zakazivanje: klijent izabere uslugu i slobodan termin za par sekundi,
              a ti odmah dobiješ obavijest. Bez stalnih poziva, bez poruka kasno navečer i bez duplih termina.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Za frizere, kozmetičke salone, autopraonice, servise, čišćenje i sve koji rade po terminima.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
              <button
                onClick={onStartFree}
                className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-3.5 font-bold sm:py-4 text-white shadow-[0_15px_45px_rgba(37,99,235,0.25)] transition hover:bg-blue-500 cursor-pointer"
              >
                Probaj 30 dana besplatno
                <span className="text-2xl font-bold">→</span>
              </button>

              <button
                onClick={onHowItWorks}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-7 py-3.5 font-semibold sm:py-4 text-white backdrop-blur-xl transition hover:bg-white/[0.07] cursor-pointer"
              >
                Pogledaj kako radi
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.07] pt-6 sm:mt-11 sm:gap-x-7 sm:gap-y-4 sm:pt-7">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-400">
                    ✓
                  </span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* DESNA STRANA: pravi prikaz proizvoda */}
          <div className="relative flex items-center justify-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.14] blur-[120px]" />

            <div className="relative z-10 w-full max-w-[300px] sm:max-w-[330px]">
              <div className="overflow-hidden rounded-[36px] border border-blue-400/25 bg-[#020617] p-2 shadow-[0_0_80px_rgba(37,99,235,0.18)]">
                <video
                  className="block aspect-[9/16] w-full rounded-[28px] object-cover"
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
