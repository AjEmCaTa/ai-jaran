"use client";

import { motion } from "framer-motion";

export default function Features() {
  return (
    <section className="bg-[#0B0B0B] py-32">
      <div className="max-w-6xl mx-auto px-8">

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center text-5xl font-bold text-white mb-16"
        >
          Šta može <span className="text-blue-500">AI JARAN?</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.03 }}
            className="rounded-3xl border border-white/10 bg-[#111111] p-8 hover:border-blue-500 transition"
          >
            <div className="text-5xl mb-5">🤖</div>

            <h3 className="text-2xl font-bold text-white">
              AI Agent
            </h3>

            <p className="mt-4 text-gray-400">
              Automatski odgovara klijentima 24 sata dnevno.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.03 }}
            className="rounded-3xl border border-white/10 bg-[#111111] p-8 hover:border-blue-500 transition"
          >
            <div className="text-5xl mb-5">📅</div>

            <h3 className="text-2xl font-bold text-white">
              Rezervacije
            </h3>

            <p className="mt-4 text-gray-400">
              Prima rezervacije bez tvoje pomoći.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.03 }}
            className="rounded-3xl border border-white/10 bg-[#111111] p-8 hover:border-blue-500 transition"
          >
            <div className="text-5xl mb-5">📱</div>

            <h3 className="text-2xl font-bold text-white">
              Instagram & WhatsApp
            </h3>

            <p className="mt-4 text-gray-400">
              Odgovara na poruke automatski.
            </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
}