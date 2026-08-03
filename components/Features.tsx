interface FeatureItem {
  title: string;
  desc: string;
}

interface FeaturesProps {
  t: {
    titleMain: string;
    titleHighlight: string;
    items: FeatureItem[];
  };
}

const icons = ["📅", "🌐", "⚡", "🎯"];

export default function Features({ t }: FeaturesProps) {
  return (
    <section id="features" className="bg-transparent py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-center text-5xl font-bold text-white mb-16">
          {t.titleMain}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
            {t.titleHighlight}
          </span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {t.items.map((item, index) => (
            <div
              key={index}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-500/10 mb-6 text-4xl">
                  {icons[index]}
                </div>
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                <p className="mt-4 text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}