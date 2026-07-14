"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  },
};

const faqs = [
  { q: "Kako AI Jaran uči o mom biznisu?", a: "Tvoj Jaran dobija pristup tvojim cjenovnicima, lokaciji i čestim pitanjima. On na osnovu toga uči i odgovara klijentima." },
  { q: "Da li mogu mijenjati ton komunikacije?", a: "Da, Jaran može biti ozbiljan i profesionalan ili opušten, zavisno od toga kako želiš da tvoj brend zvuči." },
  { q: "Šta ako se sistem zbuni?", a: "Jaran je izuzetno pametan, ali ako dobije upit koji ne zna riješiti, odmah prosljeđuje tebi notifikaciju da ti preuzmeš razgovor." },
  { q: "Koliko traje podešavanje?", a: "Podešavanje Jarana za tvoj biznis obično traje između 24 i 48 sati, zavisno od kompleksnosti tvog cjenovnika." },
  { q: "Na kojim platformama radi?", a: "Jaran trenutno podržava Instagram DM i WhatsApp Business, a uskoro dodajemo podršku za Facebook Messenger." },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-8 bg-transparent">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-4xl font-extrabold text-white mb-16">Često postavljana pitanja</h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div key={index} variants={itemVariants} className="border border-white/10 rounded-2xl bg-white/[0.02]">
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full p-6 flex justify-between items-center text-left"
              >
                <h3 className="text-lg font-bold text-white">{faq.q}</h3>
                <span className="text-2xl text-blue-500 ml-4">{activeIndex === index ? "−" : "+"}</span>
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-gray-400 text-sm"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}