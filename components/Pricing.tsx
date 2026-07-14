"use client";

import { motion } from "framer-motion";

interface PricingProps {
  onSelectPlan: (planName: string) => void;
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants: any = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  },
};

const plans = [
  {
    name: "Jaran Starter",
    price: "50 KM",
    period: "/ mjesečno",
    description: "Savršeno za male biznise i zanatlije koji tek počinju.",
    features: [
      "Povezivanje na 1 platformu (Instagram ili WhatsApp)",
      "Unos osnovnih podataka o biznisu",
      "Do 500 razgovora mjesečno",
      "Standardna tehnička podrška",
    ],
    buttonText: "Kreni sa Starterom",
    popular: false,
    value: "Jaran Starter (50 KM/mj)",
  },
  {
    name: "Jaran Pro",
    price: "120 KM",
    period: "/ mjesečno",
    description: "Najbolji izbor za restorane, rent-a-car i vile sa bazenima.",
    features: [
      "Instagram DM + WhatsApp istovremeno",
      "Pametna baza podataka (uči sve o biznisu)",
      "Automatsko zakazivanje termina",
      "Neograničen broj razgovora",
      "Prioritetna podrška 24/7",
    ],
    buttonText: "Izaberi Pro paket",
    popular: true,
    value: "Jaran Pro (120 KM/mj)",
  },
  {
    name: "Jaran Custom",
    price: "Po dogovoru",
    period: "",
    description: "Za veće sisteme i firme kojima trebaju napredne integracije.",
    features: [
      "Povezivanje sa vašim sistemima/bazama",
      "Prilagođen ton komunikacije",
      "Integracija na web sajt",
      "Namjenski server za brzinu",
      "Doživotno održavanje",
    ],
    buttonText: "Kontaktiraj nas",
    popular: false,
    value: "Jaran Custom (Po dogovoru)",
  },
];

export default function Pricing({ onSelectPlan }: PricingProps) {
  return (
    <section id="pricing" className="relative z-20 bg-[#030712] py-24">
      <div className="mx-auto max-w-6xl px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Izaberi paket za svog <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">JARANA</span>
          </h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={`relative flex flex-col justify-between rounded-3xl p-8 border transition-all duration-300 ${
                plan.popular 
                  ? "bg-[#090d1a] border-blue-500 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] scale-105" 
                  : "bg-[#050914] border-white/10 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  NAJPOPULARNIJE
                </div>
              )}
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl md:text-5xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="text-blue-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan(plan.value)}
                className={`w-full py-4 rounded-2xl font-semibold transition-all ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}