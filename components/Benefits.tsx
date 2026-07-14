"use client";

import { motion } from "framer-motion";

// Ovo je "mozak" animacije
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

const benefits = [
  { icon: "🤝", title: "Čuva ti leđa 24/7", desc: "Jaran radi dok ti odmaraš." },
  { icon: "💬", title: "Priča kao čovjek", desc: "Prirodan ton bez robotike." },
  { icon: "🔥", title: "Brzina", desc: "Rješava upite u sekundi." },
  { icon: "💼", title: "Besplatan radnik", desc: "Automatski ti donosi posao." },
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-24 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-white mb-20">
          Zašto baš <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI JARAN?</span>
        </h2>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }} // SADA SE ANIMIRA SVAKI PUT KAD SKROLAŠ DO NJE
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-8"
            >
              <div className="flex items-start gap-6">
                <div className="text-4xl">{benefit.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}