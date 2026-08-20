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
    labelMessage: string;
    placeholderMessage: string;
    loadingBtn: string;
    submitBtn: string;
  };
}

export default function ContactModal({
  isOpen,
  onClose,
  defaultSubject = "Starter (0 KM)",
  t,
}: ContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Prostrane i jasne opcije
  const packages = [
    { 
      id: "Starter (0 KM)", 
      title: "Starter Paket", 
      desc: "Besplatno zauvijek (0 KM)" 
    },
    { 
      id: "Pro Paket (50 KM/mj)", 
      title: "Pro Paket", 
      desc: "50 KM mjesečno - Full oprema" 
    },
    { 
      id: "Samo pitam", 
      title: "Samo pitam / Konsultacije", 
      desc: "Imam pitanje prije odluke" 
    },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/send-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email:
            email.trim() ||
            `${name.replace(/\s+/g, "").toLowerCase()}@aijaran.ba`,
          package: subject,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Došlo je do greške pri slanju.");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      alert("Greška: " + (err.message || "Došlo je do greške."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Box - Proširen max-w-2xl da bude komotan */}
      <div className="relative w-full max-w-2xl bg-[#030712] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl z-10 my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-6 pr-8">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
            {t?.modalTitle || "Uglavi svog Jarana"}
          </h3>
          <p className="text-xs md:text-sm text-gray-400">
            {t?.modalSubtitle ||
              "Unesi podatke i naš tim će ti se javiti u najkraćem roku za podešavanje sistema."}
          </p>
        </div>

        {success ? (
          <div className="py-12 text-center">
            <div className="text-blue-400 text-6xl mb-4">✓</div>
            <h4 className="text-2xl font-bold text-white mb-2">
              {t?.successTitle || "Uspješno poslano!"}
            </h4>
            <p className="text-sm text-gray-400">
              {t?.successDesc ||
                "Podaci su spremljeni, a obavještenje je poslano."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
            
            {/* Ime i Telefon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t?.labelName || "Ime ili naziv biznisa"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t?.placeholderName || "Npr. Salon ljepote Ana"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t?.labelPhone || "Broj telefona (WhatsApp / Viber)"}
                </label>
                <input
                  type="tel"
                  required
                  placeholder={t?.placeholderPhone || "Npr. 061 123 456"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t?.labelEmail || "Email adresa (opcionalno)"}
              </label>
              <input
                type="email"
                placeholder={t?.placeholderEmail || "Npr. info@biznis.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
              />
            </div>

            {/* Izbor paketa - Široke i udobne kartice */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t?.labelPackage || "Izaberi paket"}
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {packages.map((pkg) => (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => setSubject(pkg.id)}
                    className={`flex items-center justify-between p-3.5 px-5 rounded-2xl transition-all cursor-pointer border text-left ${
                      subject === pkg.id
                        ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-500"
                        : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{pkg.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{pkg.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      subject === pkg.id ? "border-blue-400 bg-blue-600 text-white" : "border-white/20"
                    }`}>
                      {subject === pkg.id && <span className="text-[10px]">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Poruka */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t?.labelMessage || "Kratka poruka (opcionalno)"}
              </label>
              <textarea
                placeholder={
                  t?.placeholderMessage ||
                  "Napiši ako imaš nekih specifičnih želja..."
                }
                rows={2.5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
              />
            </div>

            {/* Submit dugme */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all duration-300 mt-3 disabled:opacity-50 cursor-pointer text-base"
            >
              {loading
                ? t?.loadingBtn || "Slanje..."
                : t?.submitBtn || "Pošalji zahtjev jaranu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}