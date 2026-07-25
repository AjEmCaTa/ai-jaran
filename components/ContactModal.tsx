"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function ContactModal({ isOpen, onClose, defaultSubject = "Starter Jaran (Mali biznis)" }: ContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/send-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: phone,
          message: `Izabran paket: ${subject} | Poruka: ${message}`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setLoading(false);
          onClose();
        }, 2000);
      } else {
        setLoading(false);
        alert("Došlo je do greške. Pokušaj ponovo.");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Došlo je do greške na serveru.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#090d1a] p-8 shadow-2xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl transition-colors cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">Uglavi svog Jarana</h3>
            <p className="text-sm text-gray-400 mb-6">Unesi podatke i naš tim će ti se javiti u najkraćem roku za podešavanje sistema.</p>

            {success ? (
              <div className="py-12 text-center">
                <div className="text-green-400 text-5xl mb-4">✓</div>
                <h4 className="text-xl font-bold text-white mb-2">Uspješno poslano!</h4>
                <p className="text-sm text-gray-400">Obavještenje je stiglo na naš sistem.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ime ili naziv biznisa</label>
                  <input type="text" required placeholder="Npr. Salon ljepote Ana" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Broj telefona (WhatsApp/Viber)</label>
                  <input type="tel" required placeholder="Npr. 061 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Izaberi paket</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#090d1a] px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors">
                    <option value="Starter Jaran (Mali biznis)">Starter Jaran (Mali biznis)</option>
                    <option value="Business Jaran (Srednji biznis)">Business Jaran (Srednji biznis)</option>
                    <option value="Pro System Jaran (Veći sistemi)">Pro System Jaran (Veći sistemi)</option>
                    <option value="Opšta pitanja / Konsultacije">Samo želim pitati nešto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Kratka poruka (opcionalno)</label>
                  <textarea placeholder="Napiši ako imaš nekih specifičnih želja..." rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-blue-600 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all duration-300 mt-2 disabled:opacity-50 cursor-pointer">
                  {loading ? "Slanje..." : "Pošalji zahtjev jaranu"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}