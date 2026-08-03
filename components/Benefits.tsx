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
}

const icons = ["🤝", "💬", "🔥", "💼"];

export default function Benefits({ t }: BenefitsProps) {
  return (
    <section id="benefits" className="py-24 px-6 bg-[#030712]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-white mb-20">
          {t.titleMain}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
            {t.titleHighlight}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {t.items.map((item, index) => (
            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-start gap-6">
                <div className="text-4xl p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  {icons[index]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}