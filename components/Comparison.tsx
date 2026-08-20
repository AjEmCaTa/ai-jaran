interface AdvantageItem {
  title: string;
  desc: string;
}

interface ComparisonProps {
  t?: {
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    items?: AdvantageItem[];
  };
}

const icons = ["💬", "⏰", "📊", "🛡️", "⚡", "🎯"];

export default function Comparison({ t }: ComparisonProps) {
  return (
    <section className="py-28 px-8 bg-[#030712] relative z-25 overflow-hidden">
      {/* Suptilni plavi sjaj u pozadini */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[140px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* NASLOV I OPIS */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t?.title || "Glavne"}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              {t?.titleHighlight || "prednosti"}
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            {t?.subtitle || "Otkrijte zašto vlasnici malih biznisa i autopraonica vjeruju AI Jaranu za svakodnevne poslovne izazove."}
          </p>
        </div>

        {/* 3x2 GRID KARTICA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {(t?.items || [
            { title: "24/7 korisnička podrška", desc: "AI Jaran odgovara na pitanja vaših kupaca u bilo koje doba dana i noći, čak i kada vi spavate." },
            { title: "Ušteda vremena", desc: "Automatizirajte dosadne administrativne zadatke i fokusirajte se na ono što najbolje radite — rast vašeg biznisa." },
            { title: "Bolje poslovne odluke", desc: "Dobijajte brze analize, izvještaje i uvide koji vam pomažu da donosite pametnije odluke svaki dan." },
            { title: "Pouzdan i siguran", desc: "Vaši poslovni podaci su zaštićeni. AI Jaran je dizajniran s privatnošću i sigurnošću na prvom mjestu." },
            { title: "Jednostavan za korištenje", desc: "Bez kompliciranih podešavanja. AI Jaran se brzo integrira u postojeće alate koje već koristite." },
            { title: "Prilagođen malim biznisima", desc: "Razumijemo izazove malih biznisa. AI Jaran je cjenovno i funkcionalno prilagođen vašim potrebama." }
          ]).map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-[24px] border border-blue-500/15 bg-[#080d1c]/80 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0b1329] hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/25 mb-6 text-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {icons[index]}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide mb-3">{item.title}</h3>
                <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}