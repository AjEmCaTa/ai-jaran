"use client";

import { motion, Variants } from "framer-motion";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

const icons = ["📅", "🌐", "⚡", "🎯"];

export default function Features({ t }: FeaturesProps) {
  return (
    <section id="features" className="bg-transparent py-24">
      <div className="max-w-6xl mx-auto px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center text-5xl font-bold text-white mb-16"
        >
          {t.titleMain} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t.titleHighlight}</span>
        </motion.h2>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid md:grid-cols-2 gap-8 items-stretch"
        >
          {t.items.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-500/10 mb-6 text-4xl">
                  {icons[index]}
                </div>
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                <p className="mt-4 text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}