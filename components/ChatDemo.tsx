"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";

const categories = [
  { id: "villas", label: "🏡 Vile & Stanovi na dan" },
  { id: "autoclean", label: "🧼 Auto praonica" },
  { id: "rent", label: "🚗 Rent-a-car" },
  { id: "food", label: "🍔 Restorani & Kafići" },
];

interface ChatMessage {
  from: "user" | "ai";
  text: string;
}

const chatScenarios: Record<string, ChatMessage[]> = {
  villas: [
    { from: "user", text: "Pozdrav jarane! Tražim neku brutalnu vilu oko Mostara sa bazenom i dobrim pogledom za vikend, imaš li šta?" },
    { from: "ai", text: "Vozdra brate! Imam tačno ono što ti treba. U bazi imam vrhunsku 'Vilu River' u Blagaju – ima ogroman privatni bazen, pogled na rijeku i roštilj zonu, slobodna je ovaj vikend. Druga opcija ti je 'Penthouse Mostar' sa jacuzziem na terasi i pogledom na Stari most. Šta ti zvuči bolje? 🌊🏡" },
    { from: "user", text: "Ova u Blagaju sa bazenom je premoćna. Koliko je noć i možeš li je rezervisati?" },
    { from: "ai", text: "Za tvoju ekipu cijena je 350 KM po noći. Jaran odmah bilježi termin u kalendar, a tebi šalje instant obavijest na mobitel da je rezervacija zaključana! Uživajte! 🤝🔥" }
  ],
  autoclean: [
    { from: "user", text: "Pozdrav jarane, ima li slobodnih termina za pranje auta sutra?" },
    { from: "ai", text: "Vozdra! Izaberi termin: imam slobodno u 10:00 ujutro, a imamo i jedan termin u 14:30. Koji ti više paše da te pribilježim? 🚗⚡" },
    { from: "user", text: "Može u 14:30, upiši me." },
    { from: "ai", text: "Dogovoreno, šefe! Upisano sutra u 14:30 u kalendar, a vlasniku je poslana obavijest na mobitel. Vidimo se! 🤝" }
  ],
  rent: [
    { from: "user", text: "Jarane, koliko košta Golf 8 na 3 dana?" },
    { from: "ai", text: "Vozdra brate! Za tri dana je 150 KM ukupno sa uključenim kasko osiguranjem. Treba li ti preuzimanje na aerodromu ili kod nas u agenciji? 🚙🔑" },
    { from: "user", text: "Može na aerodromu u petak." },
    { from: "ai", text: "Riješeno! Jaran bilježi petak na aerodromu u kalendar i šalje obavijest timu. Spreman ugovor čeka na preuzimanje! ✈️" }
  ],
  food: [
    { from: "user", text: "Ej jarane, može li se rezervisati sto za večeras za 6 ljudi?" },
    { from: "ai", text: "Naravno brate, rješavamo odmah! Za koje sate planirate stići, da vam obezbijedim najbolje mjesto u objektu? 🍽️🍻" },
    { from: "user", text: "Oko pola 9 smo tu." },
    { from: "ai", text: "Sve spremno! Sto za 6 osoba upisan u kalendar za 20:30, a osoblju je odmah stigla notifikacija na mobitel. Prijatno večeras! 🎉" }
  ]
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

export default function ChatDemo() {
  const [activeTab, setActiveTab] = useState<keyof typeof chatScenarios>("villas");

  return (
    <section id="demo" className="bg-[#030712] py-32 relative z-20">
      <div className="mx-auto max-w-4xl px-8">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white"
          >
            Vidi kako <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">JARAN</span> rješava klijente
          </motion.h2>
        </div>

        {/* Kategorije / Tabovi */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-3 rounded-2xl text-sm md:text-base font-medium transition-all duration-200 border cursor-pointer ${
                activeTab === cat.id
                  ? "bg-blue-600/10 border-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Chat prozor */}
        <motion.div 
          layout
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.01] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">🤖</div>
              <div>
                <h4 className="font-bold text-white text-sm md:text-base">AI JARAN</h4>
                <p className="text-xs text-green-400">Uvijek tu • Na vezi 24/7</p>
              </div>
            </div>
          </div>

          <motion.div 
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="p-6 min-h-[400px] flex flex-col justify-end space-y-4"
          >
            {chatScenarios[activeTab].map((message, index) => (
              <motion.div
                key={index}
                variants={messageVariants}
                className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-md rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed ${
                  message.from === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20" 
                    : "border border-white/10 bg-white/[0.04] text-gray-200 rounded-tl-none"
                }`}>
                  {message.text}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}