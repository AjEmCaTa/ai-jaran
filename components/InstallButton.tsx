"use client";

import { useState, useEffect } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Dugme "Instaliraj aplikaciju". Chrome/Android/desktop: pravi install dijalog.
// iPhone: uputa (Safari nema install dijalog). Sakriveno kad je aplikacija već otvorena kao instalirana.
export default function InstallButton({ mobileOnly = true }: { mobileOnly?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const apple = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setIsIOS(apple);

    const standalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (!isIOS && deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      return;
    }
    // iPhone ili preglednik bez install dijaloga: prikaži uputu.
    setShowHelp(true);
  };

  return (
    <>
      <div className={mobileOnly ? "md:hidden w-full" : "w-full"}>
        <button
          onClick={handleClick}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-transparent px-4 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-500/10 active:scale-95"
        >
          <span aria-hidden="true">📲</span> Instaliraj aplikaciju
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0f19] p-6 text-center shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-white">
              {isIOS ? "Instalacija na iPhone" : "Instalacija aplikacije"}
            </h3>
            {isIOS ? (
              <p className="mb-4 text-sm text-slate-300">
                Otvorite <strong className="text-white">poslo.one u Safariju</strong>, tapnite dugme{" "}
                <span className="font-bold text-blue-400">Podijeli</span> (kvadrat sa strelicom) pa{" "}
                <span className="font-bold text-blue-400">&quot;Dodaj na početni ekran&quot;</span>. Obavijesti na iPhoneu rade
                samo iz aplikacije dodane na početni ekran.
              </p>
            ) : (
              <p className="mb-4 text-sm text-slate-300">
                Otvorite meni preglednika (⋮) i odaberite{" "}
                <span className="font-bold text-blue-400">&quot;Instaliraj aplikaciju&quot;</span> ili{" "}
                <span className="font-bold text-blue-400">&quot;Dodaj na početni ekran&quot;</span>. Ako te opcije nema, aplikacija je
                vjerovatno već instalirana.
              </p>
            )}
            <button
              onClick={() => setShowHelp(false)}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg"
            >
              Razumijem
            </button>
          </div>
        </div>
      )}
    </>
  );
}
