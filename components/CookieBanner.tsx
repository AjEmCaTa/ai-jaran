"use client";

import { useState, useEffect } from "react";
import { useT } from "./site/LangProvider";

const TEXT = {
  bs: { short: "Koristimo kolačiće za bolje iskustvo.", text: "Ovaj portal koristi naše kolačiće i kolačiće treće strane u cilju boljeg korisničkog iskustva, personalizacije sadržaja, unapređenja portala i naših usluga. Korišćenjem našeg portala slažete se sa upotrebom kolačića u skladu sa", cookies: "Politikom kolačića", and: "i", privacy: "Politikom privatnosti", accept: "Prihvatam" },
  en: { short: "We use cookies for a better experience.", text: "This site uses its own and third-party cookies to improve your experience, personalise content and improve the site and our services. By using the site, you agree to the use of cookies in line with our", cookies: "Cookie policy", and: "and", privacy: "Privacy policy", accept: "Accept" },
};

interface CookieBannerProps {
  onOpenPrivacy?: () => void;
}

export default function CookieBanner({ onOpenPrivacy }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const t = useT(TEXT);

  useEffect(() => {
    const consent = localStorage.getItem("ai_jaran_cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("ai_jaran_cookie_consent", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner fade-in fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#030712]/95 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl shadow-2xl flex flex-col gap-3 text-xs md:text-sm text-gray-300">
      <p className="cookie-short leading-snug">{t.short} <a href="/kolacici" className="font-semibold text-blue-400 underline">{t.cookies}</a></p>
      <p className="cookie-long leading-relaxed text-xs md:text-sm">
        {t.text}{" "}
        <button
          onClick={onOpenPrivacy}
          className="text-blue-400 underline hover:text-blue-300 cursor-pointer inline font-medium"
        >
          {t.cookies}
        </button>{" "}
        {t.and}{" "}
        <button
          onClick={onOpenPrivacy}
          className="text-blue-400 underline hover:text-blue-300 cursor-pointer inline font-medium"
        >
          {t.privacy}
        </button>
        .
      </p>

      <div className="flex items-center justify-start">
        <button
          onClick={acceptCookies}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}