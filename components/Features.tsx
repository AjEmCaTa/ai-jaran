interface FeatureItem {
  title: string;
  desc: string;
}

interface FeaturesProps {
  t?: {
    titleMain?: string;
    titleHighlight?: string;
    items?: FeatureItem[];
  };
}

const icons = ["🤖", "📅", "📦", "🏢"];

export default function Features({ t }: FeaturesProps) {
  return (
    <section className="py-28 px-8 bg-[#030712] relative z-20 overflow-hidden">
      {/* Suptilni plavi sjaj u pozadini */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-[140px]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* NASLOV I OPIS */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t?.titleMain || "Šta nudi"}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              {t?.titleHighlight || "AI JARAN?"}
            </span>
          </h2>
        </div>

        {/* HORIZONTALNI RED (JEDNA ISPOD DRUGE) */}
        <div className="space-y-6">
          {(t?.items || [
            { title: "AI Radnik 24/7", desc: "Tvoj digitalni Jaran radi bez pauze, odgovara na upite i vodi razgovore sa klijentima u bilo koje doba dana i noći." },
            { title: "Pametne Rezervacije", desc: "Klijenti samostalno biraju termine, a sistem ih automatski upisuje u tvoj kalendar, eliminišući mogućnost duplih zakazivanja." },
            { title: "Katalog za Biznise", desc: "Tvoj biznis postaje dio ekskluzivne mreže gdje te hiljade novih klijenata lako pronalaze i rezervišu tvoje usluge." },
            { title: "Sve kategorije biznisa", desc: "Autopraonice, vile, restorani ili saloni – sistem se u potpunosti konfiguriše prema specifičnim potrebama tvoje djelatnosti." }
          ]).map((item, index) => {
            const stepNum = `0${index + 1}`;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-[24px] border border-blue-500/15 bg-[#080d1c]/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0b1329] hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] flex flex-col sm:flex-row items-start sm:items-center gap-6"
              >
                {/* IKONA / ILLUSTRACIJA */}
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/25 text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {icons[index]}
                </div>

                {/* SADRŽAJ */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs tracking-wider">
                      {stepNum}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{item.title}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}