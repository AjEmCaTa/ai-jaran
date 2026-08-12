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

export default function Hero({ onStartFree, onCatalogJoin, onHowItWorks, animationKey, lang = "BS", t }: HeroProps) {
  return (
    <section 
      key={animationKey} 
      id="početna" 
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden py-24 bg-[#030712]"
    >
      {/* Pozadinski efekti svjetla */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        
        {/* Istaknuti Badge / Obavijest */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md mb-8 shadow-inner shadow-blue-500/20">
          <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            {t.badge}
          </span>
        </div>

        {/* Glavni naslov */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
          {t.titleMain} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500">
            {t.titleHighlight}
          </span>
        </h1>

        {/* Opis */}
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
          {t.description}
        </p>

        {/* Akcijska dugmad (CTA) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onStartFree} 
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {t.ctaPrimary}
          </button>
          
          <button 
            onClick={onCatalogJoin} 
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-300 font-semibold hover:bg-blue-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {t.catalogCta || (lang === "BS" ? "📦 Ubaci svoj biznis u katalog" : "📦 Add Your Business to Directory")}
          </button>
        </div>

        {/* Dodatni mali povjerenje znak / social proof */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold">✓</span> {lang === "BS" ? "Bez skrivenih troškova" : "No hidden costs"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold">✓</span> {lang === "BS" ? "Sve kategorije biznisa" : "All business categories"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold">✓</span> {lang === "BS" ? "Direktni upiti i rezervacije" : "Direct inquiries & bookings"}
          </div>
        </div>

      </div>
    </section>
  );
}