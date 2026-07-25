"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState } from "react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

const faqs = [
  { 
    q: "Kako AI Jaran uči o mom biznisu?", 
    a: "Tvoj Jaran dobija pristup tvojim cjenovnicima, uslugama i radnom vremenu. Na osnovu toga automatski odgovara klijentima i usklađuje termine." 
  },
  { 
    q: "Da li ja moram ručno odgovarati na poruke?", 
    a: "Ne. Jaran potpuno samostalno vodi razgovor u Instagram DM-u, dogovara termine i upisuje ih direktno u tvoj kalendar bez tvog uplitanja." 
  },
  { 
    q: "Šta se dešava kada se termin zakazuje?", 
    a: "Kada klijent potvrdi termin, Jaran ga upisuje u kalendar, a tebi odmah stiže čista obavijest na mobitel da znaš tačno vrijeme." 
  },
  { 
    q: "Koliko traje podešavanje i puštanje u rad?", 
    a: "Kompletno podešavanje, učenje baze i spajanje sa tvojim kalendarom traje između 2 i 3 radna dana." 
  },
  { 
    q: "Postoje li ikakvi mjesečni troškovi ili pretplate?", 
    a: "Ne. Izrada i postavljanje sistema je jednokratna investicija, čime izbjegavaš bilo kakve mjesečne naknade i komplikacije." 
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-8 bg-transparent">
      <div className="max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center text-4xl font-extrabold text-white mb-16"
        >
          Često postavljana pitanja
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;

            return (
              <motion.div 
                key={index} 
                variants={itemVariants} 
                className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setActiveIndex(isOpen ? null : index)}
                  className="w-full p-6 flex justify-between items-center text-left cursor-pointer"
                >
                  <h3 className="text-lg font-bold text-white pr-4">{faq.q}</h3>
                  <span className="text-2xl text-blue-500 font-light transition-transform duration-200">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}