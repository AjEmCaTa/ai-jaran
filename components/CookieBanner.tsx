"use client";

import { useState, useEffect } from "react";

interface CookieBannerProps {
  onOpenPrivacy?: () => void;
  t?: {
    cookieTitle?: string;
    cookieDesc?: string;
    cookieBtn?: string;
  };
}

export default function CookieBanner({ onOpenPrivacy, t }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#030712]/95 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl shadow-2xl flex flex-col gap-3 text-xs md:text-sm text-gray-300">
      <p className="leading-relaxed text-xs md:text-sm">
        {t?.cookieDesc || "Ovaj portal koristi naše kolačiće i kolačiće treće strane u cilju boljeg korisničkog iskustva, personalizacije sadržaja, unapređenja portala i naših usluga. Korišćenjem našeg portala slažete se sa upotrebom kolačića u skladu sa"} {" "}
        <button
          onClick={onOpenPrivacy}
          className="text-blue-400 underline hover:text-blue-300 cursor-pointer inline font-medium"
        >
          Politikom kolačića
        </button>{" "}
        i{" "}
        <button
          onClick={onOpenPrivacy}
          className="text-blue-400 underline hover:text-blue-300 cursor-pointer inline font-medium"
        >
          Politikom privatnosti
        </button>.
      </p>
      
      <div className="flex items-center justify-start">
        <button
          onClick={acceptCookies}
          className="px-5 py-2 rounded-xl bg-[#6b0909] hover:bg-[#850b0b] text-white text-xs font-semibold transition-all shadow-lg cursor-pointer"
        >
          {t?.cookieBtn || "Prihvatam"}
        </button>
      </div>
    </div>
  );
}