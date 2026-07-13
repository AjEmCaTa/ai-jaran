export default function Benefits() {
  const benefits = [
    {
      title: "24/7 odgovara",
      text: "Tvoj AI agent odgovara kupcima danju i noću bez pauze.",
      icon: "🕒",
    },
    {
      title: "Ne propušta klijente",
      text: "Svaka poruka dobije odgovor u roku od nekoliko sekundi.",
      icon: "⚡",
    },
    {
      title: "Prodaje umjesto tebe",
      text: "Rezervacije, upiti i prodaja potpuno automatski.",
      icon: "💰",
    },
    {
      title: "Radi na svim platformama",
      text: "Instagram, WhatsApp, Messenger i web stranica.",
      icon: "🌐",
    },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-5xl font-black text-white">
          Zašto izabrati <span className="text-blue-500">AI JARAN?</span>
        </h2>

        <p className="mt-5 text-center text-gray-400 max-w-2xl mx-auto">
          Više vremena za posao, manje vremena za odgovaranje na poruke.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-blue-500/50 transition"
            >
              <div className="text-5xl">{item.icon}</div>

              <h3 className="mt-6 text-2xl font-bold text-white">
                {item.title}
              </h3>

              <p className="mt-3 text-gray-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}