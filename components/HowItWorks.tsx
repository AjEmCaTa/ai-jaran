"use client";

import { motion } from "framer-motion";

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

const steps = [
  { number: "01", title: "Unos podataka", description: "Dostaviš nam podatke o biznisu. Mi sve ubacujemo u pametnu bazu." },
  { number: "02", title: "Brzo povezivanje", description: "Povezujemo Jarana na tvoj WhatsApp ili Instagram. Spreman za 24h." },
  { number: "03", title: "Prepusti posao Jaranu", description: "Sistem radi 24/7. Jaran odgovara, nudi usluge i dogovara termine." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-20 bg-[#030712] pt-24 pb-32">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-white mb-20">
          Sve je gotovo u <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">3 KORAKA</span>
        </h2>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="rounded-3xl p-8 bg-white/[0.01] border border-white/5"
            >
              <span className="text-5xl font-extrabold text-blue-500 block mb-6">{step.number}</span>
              <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}