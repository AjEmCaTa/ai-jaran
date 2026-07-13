"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Klijent pošalje poruku",
      text: "Na Instagramu, WhatsAppu ili web stranici.",
      emoji: "💬",
    },
    {
      number: "02",
      title: "AI JARAN odgovara",
      text: "Automatski odgovara u roku od nekoliko sekundi.",
      emoji: "🤖",
    },
    {
      number: "03",
      title: "Rezervacija završena",
      text: "AI zakazuje termin ili završava prodaju bez tvoje pomoći.",
      emoji: "✅",
    },
  ];

  return (
    <section className="bg-[#090909] py-32">
      <div className="max-w-6xl mx-auto px-8">

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center text-5xl font-bold text-white mb-20"
        >
          Kako radi <span className="text-blue-500">AI JARAN?</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                scale: 1.03,
              }}
              className="relative rounded-3xl border border-white/10 bg-[#111111] p-8"
            >
              <div className="text-5xl mb-6">
                {step.emoji}
              </div>

              <div className="text-blue-500 text-sm font-bold mb-2">
                {step.number}
              </div>

              <h3 className="text-2xl font-bold text-white">
                {step.title}
              </h3>

              <p className="mt-4 text-gray-400">
                {step.text}
              </p>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}