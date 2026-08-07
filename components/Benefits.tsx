interface BenefitItem {
  title: string;
  desc: string;
}

interface BenefitsProps {
  t: {
    titleMain: string;
    titleHighlight: string;
    items: BenefitItem[];
  };
  lang?: "BS" | "EN";
  onOpenCatalog?: () => void;
}

export default function Benefits({ lang = "BS", onOpenCatalog }: BenefitsProps) {
  return (
    <section id="benefits" className="py-24 px-6 bg-[#030712] relative z-10">
      <div className="max-w-5xl mx-auto text-center">
        
        {/* NASLOV */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            {lang === 'EN' ? "What is hidden behind this?" : "Šta se krije iza ovoga?"}
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {lang === 'EN' 
              ? "Unleash the full power of automated artificial intelligence tailored specifically for modern businesses. Click below and explore the interior." 
              : "Otključaj punu snagu automatizovane vještačke inteligencije prilagođene za moderne biznise. Klikni ispod i istraži unutrašnjost."}
          </p>
        </div>

        {/* GLAVNO MOĆNO DUGME / PORTAL ZA KATALOG */}
        <div className="relative group p-[1px] rounded-3xl bg-gradient-to-r from-blue-900/40 via-slate-800 to-indigo-950/40 max-w-2xl mx-auto shadow-2xl">
          <div className="bg-[#060b19] rounded-[23px] p-8 md:p-12 flex flex-col items-center justify-center gap-6 transition-transform group-hover:scale-[0.99]">
            
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
              🚀
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {lang === 'EN' ? "Explore the Hidden AI Solutions" : "Zaviri u skrivene AI sisteme"}
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                {lang === 'EN' 
                  ? "Discover how smart booking and instant management work in practice." 
                  : "Saznaj kako pametno zakazivanje, rezervacije i automatsko upravljanje izgledaju u praksi."}
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenCatalog) {
                  onOpenCatalog();
                }
                // AUTOMATSKI VRAĆA EKRAN NA VRH KAD SE OTVORI KATALOG
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-base transition-all duration-300 shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-3 group-hover:scale-105"
            >
              <span>{lang === 'EN' ? "Open Catalog & Test System" : "Otvori katalog i testiraj sistem"}</span>
              <span>→</span>
            </button>

          </div>
        </div>

      </div>
    </section>
  );
}