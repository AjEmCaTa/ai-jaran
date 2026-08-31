'use client';
import { useState, useEffect } from 'react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Provjera je li u pitanju iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isApple);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Aplikacija je već instalirana ili vaš pretraživač ne podržava direktnu instalaciju. Provjerite meni pretraživača (Add to Home Screen).');
    }
  };

  return (
    <>
      <div className="md:hidden w-full py-1">
        <button
          onClick={handleClick}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-blue-500/30"
        >
          <span>📲</span> Instaliraj aplikaciju
        </button>
      </div>

      {/* Modal za iPhone uputstvo */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm md:hidden">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0f19] p-6 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Instalacija na iPhone</h3>
            <p className="text-sm text-slate-300 mb-4">
              Da bi instalirali AI Jaran na iPhone ekran, kliknite na dugme <span className="text-blue-400 font-bold">Share (Podijeli)</span> na traci Vašeg Safari pretraživača, a zatim odaberite <span className="text-blue-400 font-bold">"Add to Home Screen"</span>.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
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