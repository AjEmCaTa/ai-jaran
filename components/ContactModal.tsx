"use client";

import { useEffect, useState } from "react";
import { useT } from "./site/LangProvider";
import { useMountTransition } from "./site/useMountTransition";

const TEXT = {
  bs: {
    close: "Zatvori", thanks: "Hvala na zahtjevu!", received: "Vaš zahtjev je uspješno zaprimljen. Uskoro će vam se javiti neko iz", team: "tima.",
    title: "Javi nam se", sub: "Pošalji nam svoje pitanje ili se prijavi za POSLO ONE paket. Tu smo da ti pomognemo!", plan: "Odabrani paket:",
    name: "Ime", namePh: "Npr. Marko", surname: "Prezime", surnamePh: "Npr. Marković", email: "Email adresa", emailPh: "Npr. info@biznis.com",
    phone: "Broj telefona", phonePh: "Npr. 061 123 456", message: "Poruka", messagePh: "Napiši nam ukratko šta ti je potrebno...",
    sending: "Šaljem...", send: "Pošalji zahtjev", noMessage: "Nema dodatne poruke.", sendError: "Došlo je do greške prilikom slanja zahtjeva.", error: "Došlo je do greške. Molimo pokušajte ponovo.",
  },
  en: {
    close: "Close", thanks: "Thanks for reaching out!", received: "We've received your request. Someone from the", team: "team will get back to you soon.",
    title: "Get in touch", sub: "Send us your question or sign up for a POSLO ONE plan. We're here to help!", plan: "Selected plan:",
    name: "First name", namePh: "e.g. John", surname: "Last name", surnamePh: "e.g. Smith", email: "Email address", emailPh: "e.g. info@business.com",
    phone: "Phone number", phonePh: "e.g. +387 61 123 456", message: "Message", messagePh: "Tell us briefly what you need...",
    sending: "Sending...", send: "Send request", noMessage: "No additional message.", sendError: "Something went wrong while sending your request.", error: "Something went wrong. Please try again.",
  },
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

export default function ContactModal({
  isOpen,
  onClose,
  defaultSubject,
}: ContactModalProps) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const t = useT(TEXT);
  const [mounted, shown] = useMountTransition(isOpen, 250);

  // Dok je forma otvorena, stranica ispod se ne pomjera.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSending(true);
    setError("");

    try {
      const fullName = `${name} ${surname}`.trim();

      const response = await fetch("/api/send-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          package: defaultSubject || "Opšta pitanja / Konsultacije",
          message: message || t.noMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || t.sendError
        );
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Greška pri slanju forme:", err);
      setError(
        err.message || t.error
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (isSending) return;

    setSuccess(false);
    setError("");
    setName("");
    setSurname("");
    setEmail("");
    setPhone("");
    setMessage("");

    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto transition-opacity duration-250 ease-out ${shown ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <div className={`relative w-full max-w-xl bg-[#030712] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl z-10 my-auto max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-300 ease-out ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"}`}>
        <button
          onClick={handleClose}
          disabled={isSending}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t.close}
        >
          ✕
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-16 h-16 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
              {t.thanks}
            </h3>

            <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-md">
              {t.received} <span className="text-white font-semibold">POSLO ONE</span>{" "}
              {t.team}
            </p>

            <button
              onClick={handleClose}
              className="mt-8 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 pr-8">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                {t.title}
              </h3>

              <p className="text-xs md:text-sm text-gray-400">
                {t.sub}
              </p>

              {/* Prikaz odabranog paketa */}
              {defaultSubject &&
                defaultSubject !== "Opšta pitanja / Konsultacije" && (
                  <div className="mt-4 inline-flex items-center rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400">
                    {t.plan} {defaultSubject}
                  </div>
                )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 text-xs md:text-sm"
            >
              {/* Ime i Prezime */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t.name}
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t.namePh}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t.surname}
                  </label>

                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                    placeholder={t.surnamePh}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-base sm:text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t.email} <span className="text-blue-500">*</span>
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t.emailPh}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-base sm:text-sm"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t.phone}
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePh}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-base sm:text-sm"
                />
              </div>

              {/* Poruka */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t.message}
                </label>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={t.messagePh}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-base sm:text-sm"
                />
              </div>

              {/* Greška */}
              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit dugme */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all duration-300 mt-3 cursor-pointer text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSending ? t.sending : t.send}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}