"use client";

import { motion, Variants } from "framer-motion";

interface PricingProps {
  t?: any;
  onSelectPlan: (planName: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

export default function Pricing({ t, onSelectPlan }: PricingProps) {
  const plans = t?.plans || [
    {
      name: "Starter Jaran",
      badge: "Mali biznis / Samostalni radnik",
      price: "Po dogovoru",
      description: "Idealno za pojedince i male obrte. Jaran preuzima Instagram DM, samostalno dogovara termine i upisuje ih u tvoj kalendar.",
      features: [
        "Povezivanje na Instagram DM i tvoj kalendar",
        "Automatsko odgovaranje na upite i cijene 24/7",
        "Direktno zakazivanje termina bez tvog uplitanja",
        "Telegram obavijesti u realnom vremenu o svakoj rezervaciji",
        "Gotovo i pušteno u rad za 2 do 3 radna dana",
        "Fleksibilan dogovor i avansno pokretanje izrade",
      ],
      buttonText: "Zatraži Starter",
      popular: false,
      value: "Starter Jaran (Mali biznis)",
    },
    {
      name: "Business Jaran",
      badge: "Srednji biznis (2-3 zaposlenika)",
      price: "Po dogovoru",
      description: "Za salone, servise i biznise sa više usluga. Moćniji AI sistem koji upravlja rasporedom i šalje precizne notifikacije tvojoj ekipi.",
      features: [
        "Napredna Instagram DM automatizacija",
        "Pametna baza podataka sa svim cijenama i uslugama",
        "Sinhronizacija sa kalendarom cijelog tima",
        "Telegram obavijesti i detaljan pregled rezervacija",
        "Prioritetno postavljanje i podešavanje (2-3 dana)",
        "Prilagođeni uslovi i siguran dogovor saradnje",
      ],
      buttonText: "Zatraži Business",
      popular: true,
      value: "Business Jaran (Srednji biznis)",
    },
    {
      name: "Pro System Jaran",
      badge: "Veći sistemi i kompanije",
      price: "Po dogovoru",
      description: "Kompletno prilagođeno rješenje za veće obime posla, više kanala i specifične poslovne integracije sa tvojim internim alatima.",
      features: [
        "Multi-kanalna AI podrška i custom integracije",
        "Povezivanje sa naprednim kalendarima i bazama",
        "Telegram sistem obavještavanja za cijeli tim",
        "Namjenski server za maksimalnu brzinu i stabilnost",
        "Dugoročna tehnička podrška i dorade",
        "Individualna ponuda i uslovi realizacije",
      ],
      buttonText: "Zatraži Custom Ponudu",
      popular: false,
      value: "Pro System Jaran (Veći sistemi)",
    },
  ];

  return (
    <section id="pricing" className="relative z-20 bg-[#030712] py-24">
      <div className="mx-auto max-w-4xl px-6">
        
        {/* Naslov sekcije */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4"
          >
            {t?.titleMain || "Investiraj u svog"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t?.titleHighlight || "DIGITALNOG RADNIKA"}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            {t?.subtitle || "Brza izrada i spajanje sa tvojim kalendarom za samo 2 do 3 radna dana. Uslovi i obim posla dogovaraju se direktno."}
          </motion.p>
        </div>

        {/* Vertikalni raspored paketa */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-8"
        >
          {plans.map((plan: any, index: number) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={`relative flex flex-col md:flex-row justify-between items-start md:items-center rounded-3xl p-8 md:p-10 border transition-all duration-300 gap-8 ${
                plan.popular 
                  ? "bg-[#090d1a] border-blue-500/80 shadow-[0_0_30px_-10px_rgba(59,130,246,0.25)]" 
                  : "bg-[#050914] border-white/10 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-8 md:left-10 bg-blue-600 text-white text-[11px] font-bold tracking-widest uppercase px-4 py-1 rounded-full shadow-md">
                  {t?.popularBadge || "NAJTRAŽENIJI PAKET"}
                </div>
              )}

              {/* Lijeva strana - Detalji */}
              <div className="flex-1">
                <div className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md mb-3 border border-blue-500/20">
                  {plan.badge}
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xl leading-relaxed">{plan.description}</p>
                
                <ul className="space-y-3">
                  {plan.features.map((feature: string, fIndex: number) => (
                    <li key={fIndex} className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Desna strana - Cijena i Akcija */}
              <div className="w-full md:w-auto flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 min-w-[220px]">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t?.priceModel || "Model saradnje"}</span>
                <span className="text-2xl font-extrabold text-white mb-6">{plan.price || t?.priceValue || "Po dogovoru"}</span>

                <button
                  onClick={() => onSelectPlan(plan.value)}
                  className={`w-full py-4 px-6 rounded-2xl font-bold transition-all text-sm tracking-wide cursor-pointer ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {plan.buttonText} 🚀
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}