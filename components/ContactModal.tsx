"use client";

import Script from "next/script";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  t?: {
    modalTitle: string;
    modalSubtitle: string;
  };
}

export default function ContactModal({
  isOpen,
  onClose,
  t,
}: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Skripta za Mailchimp validaciju */}
      <Script
        src="//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js"
        strategy="lazyOnload"
      />

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-xl bg-[#030712] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl z-10 my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-6 pr-8">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
            {t?.modalTitle || "Javi se svom AI Jaranu"}
          </h3>
          <p className="text-xs md:text-sm text-gray-400">
            {t?.modalSubtitle || "Prijavi se na našu listu i postavi pitanje. Tu smo da ti pomognemo!"}
          </p>
        </div>

        {/* Mailchimp Form Integration */}
        <form
          action="https://aijaran.us9.list-manage.com/subscribe/post?u=5a032a11837ebc1a66920aa00&amp;id=714a9a33e8&amp;f_id=001353e1f0"
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="space-y-4 text-xs md:text-sm"
          target="_blank"
        >
          {/* Ime i Prezime */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Ime
              </label>
              <input
                type="text"
                name="FNAME"
                id="mce-FNAME"
                placeholder="Npr. Marko"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Prezime
              </label>
              <input
                type="text"
                name="LNAME"
                id="mce-LNAME"
                placeholder="Npr. Marković"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Email adresa <span className="text-blue-500">*</span>
            </label>
            <input
              type="email"
              name="EMAIL"
              id="mce-EMAIL"
              required
              placeholder="Npr. info@biznis.com"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Broj telefona
            </label>
            <input
              type="text"
              name="PHONE"
              id="mce-PHONE"
              placeholder="Npr. 061 123 456"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* Anti-bot polje (skriveno) */}
          <div aria-hidden="true" className="absolute -left-[5000px]">
            <input
              type="text"
              name="b_5a032a11837ebc1a66920aa00_714a9a33e8"
              tabIndex={-1}
              defaultValue=""
            />
          </div>

          {/* Mailchimp odgovori */}
          <div id="mce-responses" className="clear foot">
            <div className="response text-red-400 text-xs my-2" id="mce-error-response" style={{ display: 'none' }}></div>
            <div className="response text-green-400 text-xs my-2" id="mce-success-response" style={{ display: 'none' }}></div>
          </div>

          {/* Submit dugme */}
          <button
            type="submit"
            name="subscribe"
            id="mc-embedded-subscribe"
            className="w-full py-4 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all duration-300 mt-3 cursor-pointer text-base"
          >
            Prijavi se / Pošalji
          </button>
        </form>
      </div>
    </div>
  );
}