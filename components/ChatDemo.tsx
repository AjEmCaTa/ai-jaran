"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

const categories = [
  { id: "villas", label: "🏡 Vile & Stanovi na dan" },
  { id: "autoclean", label: "🧼 Auto praonica" },
  { id: "rent", label: "🚗 Rent-a-car" },
  { id: "food", label: "🍔 Restorani & Kafići" },
];

const chatScenarios = {
  villas: [
    { from: "user", text: "Pozdrav jarane! Tražim neku brutalnu vilu oko Mostara sa bazenom i dobrim pogledom za vikend, imaš li šta?" },
    { from: "ai", text: "Vozdra brate! Imam tačno ono što ti treba. U bazi imam vrhunsku 'Vilu River' u Blagaju – ima ogroman privatni bazen, pogled na rijeku i roštilj zonu, slobodna je ovaj vikend. Druga opcija ti je 'Penthouse Mostar' sa jacuzziem na terasi i pogledom na Stari most. Šta ti zvuči bolje? 🌊🏡" },
    { from: "user", text: "Ova u Blagaju sa bazenom je premoćna. Koliko je noć i možeš li me spojiti s gazdom?" },
    { from: "ai", text: "Za tvoju ekipu cijena je 350 KM po noći. Jaran te odmah spaja! Klikni na link ispod da ti pošaljem direktan kontakt vlasnika na WhatsApp da dogovorite detalje i potvrdite rezervaciju. Uživajte! 🤝🔥" }
  ],
  autoclean: [
    { from: "user", text: "Pozdrav jarane, ima li slobodnih termina za pranje auta sutra?" },
    { from: "ai", text: "Vozdra! Izaberi termin: imam slobodno u 10:00 ujutro, a imamo i jedan termin u 14:30. Koji ti više paše da te pribilježim? 🚗⚡" },
    { from: "user", text: "Može u 14:30, upiši me." },
    { from: "ai", text: "Dogovoreno, šefe! Upisano sutra u 14:30. Samo mi pusti ime i broj tablica da imamo u evidenciji. Vidimo se! 🤝" }
  ],
  rent: [
    { from: "user", text: "Jarane, koliko košta Golf 8 na 3 dana?" },
    { from: "ai", text: "Vozdra brate! Za tri dana je 150 KM ukupno sa uključenim kasko osiguranjem. Treba li ti preuzimanje na aerodromu ili kod nas u agenciji? 🚙🔑" },
    { from: "user", text: "Može na aerodromu u petak." },
    { from: "ai", text: "Riješeno! Jaran bilježi petak na aerodromu. Pošalji mi samo sliku vozačke u chat da ti odmah spremim ugovor da ne gubiš vrijeme kad sletiš. ✈️" }
  ],
  food: [
    { from: "user", text: "Ej jarane, može li se rezervisati sto za večeras za 6 ljudi?" },
    { from: "ai", text: "Naravno brate, rješavamo odmah! Za koje sate planirate stići, da vam obezbijedim najbolje mjesto u objektu? 🍽️🍻" },
    { from: "user", text: "Oko pola 9 smo tu." },
    { from: "ai", text: "Sve spremno! Sto za 6 osoba vas čeka u 20:30. Ako bude kakvih promjena, samo šibni poruku ovdje. Prijatno večeras! 🎉" }
  ]
};

const chatContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
    },
  },
};

// POPRAVLJENO: Uklonjen 'y' pomak da izbjegnemo trzanje sa Flexboxom
const messageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 180, 
      damping: 20 
    } 
  },
};

export default function ChatDemo() {
  const [activeTab, setActiveTab] = useState<keyof typeof chatScenarios>("villas");

  return (
    <section id="demo" className="bg-[#030712] py-32 relative z-20">
      <div className="mx-auto max-w-4xl px-8">

        {/* Naslov */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white"
          >
            Vidi kako <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">JARAN</span> rješava klijente
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-gray-400 text-lg mt-4"
          >
            Klikni na vrstu biznisa i pogledaj kako tvoj AI pomoćnik opušteno i brzo završava posao.
          </motion.p>
        </div>

        {/* Dugmad */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id as keyof typeof chatScenarios)}
              className={`px-5 py-3 rounded-2xl text-sm md:text-base font-medium transition-all duration-300 border ${
                activeTab === cat.id
                  ? "bg-blue-600/10 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                  : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Chat prozor */}
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.01] backdrop-blur-xl shadow-2xl"
        >
          {/* Zaglavlje */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">🤖</div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#030712]" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm md:text-base">AI JARAN</h4>
                <p className="text-xs text-green-400 font-medium">Uvijek tu • Na vezi 24/7</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Poruke */}
          <div className="p-6 min-h-[400px] flex flex-col justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={chatContainerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-5"
              >
                {chatScenarios[activeTab].map((message, index) => (
                  <motion.div
                    key={index}
                    variants={messageVariants}
                    className={`flex ${
                      message.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-md rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed shadow-md ${
                        message.from === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "border border-white/15 bg-white/[0.04] text-gray-200 rounded-tl-none"
                      }`}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Donji Input */}
          <div className="border-t border-white/5 bg-white/[0.01] px-6 py-4 flex items-center justify-between text-white/30 text-xs md:text-sm">
            <span>Napiši poruku Jaranu...</span>
            <div className="flex items-center gap-3 text-lg">
              <span>🎙️</span>
              <span>📎</span>
              <span className="text-blue-500">➡️</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}