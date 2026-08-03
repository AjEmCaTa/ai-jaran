export default function Comparison({ t }: { t?: any }) {
  return (
    <section className="py-32 px-8 bg-[#030712] relative z-20">
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            {t?.title || "Razlika koja"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t?.titleHighlight || "donosi novac"}</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            {t?.subtitle || "Pogledaj kako izgleda vođenje posla bez sistema i sa Jaranom u ekipi."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LIJEVA STRANA: Stari način (Haos) */}
          <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 text-7xl opacity-10 select-none">❌</div>
            <div className="inline-block px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider mb-6">
              {t?.oldBadge || "Stari način (Bez Jarana)"}
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">{t?.oldTitle || "Gubljenje klijenata i živaca"}</h3>
            
            <ul className="space-y-4 text-gray-400 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span>{t?.old1 || "Poruke u 23:00 ostaju nepročitane, klijent ujutro odustane i ode kod konkurencije."}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span>{t?.old2 || "Vječito kuckanje iste cijene, lokacije i slobodnih termina po sto puta dnevno."}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span>{t?.old3 || "Dupla rezervacija istog termina jer se zaboravilo upisati u svesku ili Excel."}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span>{t?.old4 || "Zveči telefon dok si na terenu ili odmaraš s porodicom."}</span>
              </li>
            </ul>
          </div>

          {/* DESNA STRANA: Novi način (AI Jaran) */}
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/[0.03] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-blue-500/5">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 text-7xl opacity-10 select-none">🤖</div>
            <div className="inline-block px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider mb-6">
              {t?.newBadge || "Novi način (Sa AI Jaranom)"}
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">{t?.newTitle || "Automatizovan biznis 24/7"}</h3>
            
            <ul className="space-y-4 text-gray-300 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-0.5">✓</span>
                <span>{t?.new1 || "Instant odgovor u sekundi, bez obzira je li 3 ujutro ili subota popodne."}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-0.5">✓</span>
                <span>{t?.new2 || "Jaran samostalno vodi razgovor prema tvojoj bazi znanja i cjenovniku."}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-0.5">✓</span>
                <span>{t?.new3 || "Termin se automatski upisuje u kalendar, a tebi stiže čista notifikacija."}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-0.5">✓</span>
                <span>{t?.new4 || "Ti imaš punu kontrolu i slobodno vrijeme za ono što je stvarno bitno."}</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}