"use client";

import { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  t?: {
    modalTitle: string;
    modalSubtitle: string;
    successTitle: string;
    successDesc: string;
    labelName: string;
    placeholderName: string;
    labelPhone: string;
    placeholderPhone: string;
    labelEmail: string;
    placeholderEmail: string;
    labelPackage: string;
    opt1: string;
    opt2: string;
    opt3: string;
    opt4: string;
    labelMessage: string;
    placeholderMessage: string;
    loadingBtn: string;
    submitBtn: string;
  };
}

export default function ContactModal({ isOpen, onClose, defaultSubject = "Starter Jaran (Mali biznis)", t }: ContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Optimizovani nazivi koji staju u 2x2 grid bez sječenja teksta
  const packages = [
    { id: "Starter Jaran (Mali biznis)", label: "Starter Jaran" },
    { id: "Business Jaran (Srednji biznis)", label: "Business Jaran" },
    { id: "Pro System Jaran (Veći sistemi)", label: "Pro System" },
    { id: "Opšta pitanja / Konsultacije", label: t?.opt4 || "Samo pitam" },
  ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-xl bg-[#030712] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl z-10 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-base"
        >
          ✕
        </button>

        <div className="mb-5 pr-6">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
            {t?.modalTitle || "Uglavi svog Jarana"}
          </h3>
          <p className="text-xs md:text-sm text-gray-400">
            {t?.modalSubtitle || "Unesi podatke i naš tim će ti se javiti u najkraćem roku."}
          </p>
        </div>

        {success ? (
          <div className="py-12 text-center">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <h4 className="text-xl font-bold text-white mb-2">
              {t?.successTitle || "Uspješno poslano!"}
            </h4>
            <p className="text-sm text-gray-400">
              {t?.successDesc || "Podaci su spremljeni, a obavještenje je poslano."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs md:text-sm">
            
            {/* Grid za Ime i Telefon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {t?.labelName || "Ime ili naziv biznisa"}
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder={t?.placeholderName || "Npr. Salon ljepote Ana"} 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-xs md:text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {t?.labelPhone || "Broj telefona (WhatsApp/Viber)"}
                </label>
                <input 
                  type="tel" 
                  required 
                  placeholder={t?.placeholderPhone || "Npr. 061 123 456"} 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-xs md:text-sm" 
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t?.labelEmail || "Email adresa (opcionalno)"}
              </label>
              <input 
                type="email" 
                placeholder={t?.placeholderEmail || "Npr. info@biznis.com"} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-xs md:text-sm" 
              />
            </div>

            {/* Interaktivne kartice u 2x2 rasporedu za čitak prikaz */}
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t?.labelPackage || "Izaberi paket / Opciju"}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {packages.map((pkg) => (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => setSubject(pkg.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer border text-center ${
                      subject === pkg.id
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                        : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {pkg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Poruka */}
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t?.labelMessage || "Kratka poruka (opcionalno)"}
              </label>
              <textarea 
                placeholder={t?.placeholderMessage || "Napiši ako imaš nekih specifičnih želja..."} 
                rows={2} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none text-xs md:text-sm" 
              />
            </div>

            {/* Submit dugme */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 md:py-3.5 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all duration-300 mt-2 disabled:opacity-50 cursor-pointer text-xs md:text-sm"
            >
              {loading ? (t?.loadingBtn || "Slanje...") : (t?.submitBtn || "Pošalji zahtjev jaranu")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}