"use client";

import { motion, Variants } from "framer-motion";

interface HeroProps {
  onStartFree: () => void;
  animationKey?: number;
  t: {
    badge: string;
    titleMain: string;
    titleHighlight: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

export default function Hero({ onStartFree, animationKey, t }: HeroProps) {
  return (
    <section id="početna" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        key={animationKey}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl mx-auto px-8 text-center"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t.badge}</span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8"
        >
          {t.titleMain} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {t.titleHighlight}
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12"
        >
          {t.description}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onStartFree} className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 cursor-pointer">
            {t.ctaPrimary}
          </button>
          <a href="#how-it-works" className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all">
            {t.ctaSecondary}
          </a>
        </motion.div>

      </motion.div>
    </section>
  );
}