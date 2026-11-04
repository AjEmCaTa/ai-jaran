interface FeatureItem {
  title: string;
  desc: string;
}

const icons = ["🔗", "📅", "🔔", "⏰"];

const items: FeatureItem[] = [
  {
    title: "Dobiješ svoju stranicu za zakazivanje",
    desc: "Unesemo tvoje usluge, cijene i radno vrijeme. Dobiješ link i QR kod koji staviš na Instagram, WhatsApp, Google ili vrata radnje.",
  },
  {
    title: "Klijent sam izabere termin",
    desc: "Vidi usluge, cijene i slobodne termine i zakaže za par sekundi, u bilo koje doba. Zauzeti termini se ne mogu duplo zakazati.",
  },
  {
    title: "Ti odmah dobiješ obavijest",
    desc: "Novi zahtjev stiže na email i telefon. Potvrdiš ili predložiš drugi termin jednim klikom, a klijent automatski dobije mail.",
  },
  {
    title: "Podsjetnik i pošteno otkazivanje",
    desc: "Klijent dobije podsjetnik 24 sata prije termina. Može otkazati najkasnije 2 sata ranije, pa se termin oslobađa za nekog drugog.",
  },
];

export default function Features() {
  return (
    <section id="demo" className="scroll-mt-24 py-16 px-6 sm:py-28 sm:px-8 bg-[#030712] relative z-20 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-[140px]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Kako{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              radi?
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg">Četiri koraka, a prvi za tebe uradimo mi.</p>
        </div>

        <div className="space-y-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-[24px] border border-blue-500/15 bg-[#080d1c]/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0b1329] hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/25 text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {icons[index]}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs tracking-wider">
                    {`0${index + 1}`}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{item.title}</h3>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
