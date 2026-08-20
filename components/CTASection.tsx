interface CtaSectionProps {
  onDemoClick?: () => void;
  onContactClick?: () => void;
}

export default function CtaSection({ onDemoClick, onContactClick }: CtaSectionProps) {
  return (
    <section className="py-24 px-8 bg-[#030712] relative z-20 text-center">
      <div className="max-w-4xl mx-auto rounded-[32px] border border-blue-500/20 bg-gradient-to-b from-[#080d1c] to-[#040814] p-10 sm:p-16 shadow-2xl relative overflow-hidden">
        
        {/* Pozadinski sjaj */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Spremni da vaš biznis radi pametnije?
        </h2>
        
        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Pridružite se malim biznisima koji već koriste AI Jaran da bi uštedjeli sate svakog tjedna. Počnite besplatno — bez kreditne kartice.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onDemoClick}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500 hover:scale-[1.02] cursor-pointer"
          >
            Zatraži besplatnu demonstraciju <span className="ml-2">→</span>
          </button>
          
          <button
            onClick={onContactClick}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-800 bg-[#080d1c] px-8 py-4 font-semibold text-slate-200 transition-all duration-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            Kontaktiraj nas
          </button>
        </div>

      </div>
    </section>
  );
}