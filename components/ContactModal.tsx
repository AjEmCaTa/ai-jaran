"use client";

import { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  t?: any;
}

export default function ContactModal({ isOpen, onClose, defaultSubject = "Starter Jaran (Mali biznis)", t }: ContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/send-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || `${name.replace(/\s+/g, '').toLowerCase()}@AIjaran.com`,
          package: subject,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Došlo je do greške pri slanju.');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      alert("Greška: " + (err.message || "Došlo je do greške."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#090d1a] p-8 shadow-2xl z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl transition-colors cursor-pointer"
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold text-white mb-2">{t?.modalTitle || "Uglavi svog Jarana"}</h3>
        <p className="text-sm text-gray-400 mb-6">{t?.modalSubtitle || "Unesi podatke i naš tim će ti se javiti u najkraćem roku za podešavanje sistema."}</p>

        {success ? (
          <div className="py-12 text-center">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <h4 className="text-xl font-bold text-white mb-2">{t?.successTitle || "Uspješno poslano!"}</h4>
            <p className="text-sm text-gray-400">{t?.successDesc || "Podaci su spremljeni, a obavještenje je poslano."}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t?.labelName || "Ime ili naziv biznisa"}</label>
              <input type="text" required placeholder={t?.placeholderName || "Npr. Salon ljepote Ana"} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t?.labelPhone || "Broj telefona (WhatsApp/Viber)"}</label>
              <input type="tel" required placeholder={t?.placeholderPhone || "Npr. 061 123 456"} value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t?.labelEmail || "Email adresa (opcionalno)"}</label>
              <input type="email" placeholder={t?.placeholderEmail || "Npr. info@biznis.com"} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t?.labelPackage || "Izaberi paket"}</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#090d1a] px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors">
                <option value="Starter Jaran (Mali biznis)">{t?.opt1 || "Starter Jaran (Mali biznis)"}</option>
                <option value="Business Jaran (Srednji biznis)">{t?.opt2 || "Business Jaran (Srednji biznis)"}</option>
                <option value="Pro System Jaran (Veći sistemi)">{t?.opt3 || "Pro System Jaran (Veći sistemi)"}</option>
                <option value="Opšta pitanja / Konsultacije">{t?.opt4 || "Samo želim pitati nešto"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t?.labelMessage || "Kratka poruka (opcionalno)"}</label>
              <textarea placeholder={t?.placeholderMessage || "Napiši ako imaš nekih specifičnih želja..."} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-blue-600 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all duration-300 mt-2 disabled:opacity-50 cursor-pointer">
              {loading ? (t?.loadingBtn || "Slanje...") : (t?.submitBtn || "Pošalji zahtjev jaranu")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}