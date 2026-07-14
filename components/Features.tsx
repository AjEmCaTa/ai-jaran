"use client";

import { motion } from "framer-motion";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  },
};

export default function Features() {
  return (
    <section id="features" className="bg-transparent py-24">
      <div className="max-w-6xl mx-auto px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.5 }}
          className="text-center text-5xl font-bold text-white mb-16"
        >
          Šta može <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI JARAN?</span>
        </motion.h2>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            { icon: "🤖", title: "Pametni Agent", desc: "Komunicira sa tvojim klijentima prirodno, odgovara na njihova pitanja o uslugama, cijenama i lokaciji 24 sata dnevno." },
            { icon: "📅", title: "Automatske Rezervacije", desc: "Klijenti mogu zakazati termin direktno kroz razgovor. Jaran provjerava tvoj kalendar i bilježi rezervaciju bez tvog uplitanja." },
            { icon: "📱", title: "Multiplatform Integracija", desc: "Povezuje se direktno na tvoj Instagram DM i WhatsApp. Gdje god da ti klijent piše, Jaran je tu da odmah odgovori." }
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-500/10 mb-6 text-4xl">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-4 text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}