interface AdvantageItem {
  title: string;
  desc: string;
}

const icons = ["📞", "✅", "📱", "🤝", "🛡️", "💶"];

const items: AdvantageItem[] = [
  {
    title: "Manje poziva i poruka",
    desc: "Klijenti ne moraju zvati da pitaju ima li slobodno. Vide sami i zakažu, a ti ne prekidaš posao zbog telefona.",
  },
  {
    title: "Nema duplih termina",
    desc: "Sistem ne dozvoljava dva klijenta u isto vrijeme. Kalendar je uvijek tačan.",
  },
  {
    title: "Sve s mobitela",
    desc: "Rezervacije vodiš s mobitela, a POSLO ONE možeš dodati na početni ekran kao aplikaciju.",
  },
  {
    title: "Postavimo sve za tebe",
    desc: "Pošalji nam usluge i cijene, a mi pripremimo tvoju stranicu. Ne trebaš znati ništa o računarima.",
  },
  {
    title: "Tvoji podaci su zaštićeni",
    desc: "Podaci svake firme su odvojeni. Tvoje rezervacije i klijente vidiš samo ti.",
  },
  {
    title: "Jasna cijena",
    desc: "Starter 15 KM, Pro 50 KM mjesečno. Prvih 30 dana besplatno za oba paketa.",
  },
];

export default function Comparison() {
  return (
    <section className="py-12 px-5 sm:py-28 sm:px-8 bg-[#030712] relative z-25 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[140px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Zašto{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              POSLO ONE?
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">
            Napravljen za male firme koje rade po terminima i nemaju vremena za komplikovane programe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 items-stretch">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-[24px] border border-blue-500/15 bg-[#080d1c]/80 p-4 sm:p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0b1329] hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] flex flex-col justify-between"
            >
              <div className="flex flex-row items-start gap-4 sm:block">
                <div className="w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/25 sm:mb-6 text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {icons[index]}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[17px] leading-snug sm:text-2xl font-bold text-white mb-1 sm:mb-3">{item.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-[13.5px] sm:text-base">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
