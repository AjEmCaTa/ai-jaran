interface HeroProps {
  onStartFree: () => void;
  onHowItWorks?: () => void;
  animationKey?: number;
  t: {
    badge: string;
    titleMain: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

export default function Hero({ onStartFree, onHowItWorks, animationKey, t }: HeroProps) {
  return (
    <section id="početna" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 bg-[#030712]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t.badge}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8">
          {t.titleMain} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
            {t.titleHighlight}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          {t.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onStartFree} className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 cursor-pointer">
            {t.ctaPrimary}
          </button>
          
          <button 
            onClick={onHowItWorks || (() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" }))} 
            className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all cursor-pointer"
          >
            {t.ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
}