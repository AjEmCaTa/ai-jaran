"use client";

import { motion, Variants } from "framer-motion";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

const icons = ["🤝", "💬", "🔥", "💼"];

export default function Benefits({ t }: BenefitsProps) {
  return (
    <section id="benefits" className="py-24 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center text-4xl md:text-5xl font-extrabold text-white mb-20"
        >
          {t.titleMain} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t.titleHighlight}</span>
        </motion.h2>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {t.items.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-start gap-6">
                <div className="text-4xl p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">{icons[index]}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}