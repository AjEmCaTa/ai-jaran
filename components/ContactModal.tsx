"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

export default function ContactModal({ isOpen, onClose, defaultSubject = "Generalni upit" }: ContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yourPhoneNumber = "387603050153"; 
    const text = `Pozdrav! Moje ime je ${name}.%0A%0ATelefon: ${phone}%0A%0AZanima me: *${subject}*%0APoruka: ${message}`;
    const whatsappUrl = `https://wa.me/${yourPhoneNumber}?text=${text}`;
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#090d1a] p-8 shadow-2xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl transition-colors"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">Uglavi svog Jarana</h3>
            <p className="text-sm text-gray-400 mb-6">Unesi podatke i naš tim će te kontaktirati na WhatsApp da ti sve podesimo.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Polja su ostala ista, logika je netaknuta */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ime ili naziv biznisa</label>
                <input type="text" required placeholder="Npr. Vila Bella Blagaj" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Broj telefona (WhatsApp/Viber)</label>
                <input type="tel" required placeholder="Npr. 061 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Izaberi paket</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#090d1a] px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors">
                  <option value="Jaran Starter (50 KM/mj)">Jaran Starter (50 KM/mj)</option>
                  <option value="Jaran Pro (120 KM/mj)">Jaran Pro (120 KM/mj)</option>
                  <option value="Jaran Custom (Po dogovoru)">Jaran Custom (Po dogovoru)</option>
                  <option value="Opšta pitanja / Konsultacije">Samo želim pitati nešto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Kratka poruka (opcionalno)</label>
                <textarea placeholder="Napiši ako imaš nekih specifičnih želja..." rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
              </div>

              <button type="submit" className="w-full py-4 rounded-2xl bg-blue-600 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all duration-300 mt-2">
                Pošalji zahtjev jaranu
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}