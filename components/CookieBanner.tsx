"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CookieBannerProps {
  t?: {
    cookieTitle?: string;
    cookieDesc?: string;
    cookieBtn?: string;
  };
}

export default function CookieBanner({ t }: CookieBannerProps) {
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

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 bg-[#0b0f19]/95 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h4 className="text-white text-sm font-semibold">
              {t?.cookieTitle || "Politika kolačića i privatnosti"}
            </h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              {t?.cookieDesc || "Koristimo minimalne kolačiće za rad stranice i analizu. Vaši podaci s kontakt forme koriste se isključivo za dogovor i komunikaciju."}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={acceptCookies}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {t?.cookieBtn || "Prihvatam"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}