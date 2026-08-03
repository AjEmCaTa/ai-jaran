"use client";

import { useState, useEffect } from "react";

export default function ChatDemo({ t }: { t?: any }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "1. Klijent šalje poruku",
      subtitle: "Instagram DM",
      icon: "💬",
      content: "Zdravo! Imate li slobodan termin za vikendicu ove subote?",
      badge: "Nova poruka stigla",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    {
      title: "2. AI Jaran obrađuje upit",
      subtitle: "Baza & Dostupnost",
      icon: "🤖",
      content: "Provjeravam kalendar... Subota je slobodna! Cijena je 250 KM.",
      badge: "AI analizira bazu",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      title: "3. Automatska potvrda i termin",
      subtitle: "Google Calendar & Telegram",
      icon: "⚡",
      content: "Termin uspješno rezervisan! Obavještenje poslato na Telegram vlasniku.",
      badge: "Završeno automatski",
      badgeColor: "bg-green-500/10 text-green-400 border-green-500/20"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <section id="chat-demo" className="py-24 px-6 bg-transparent">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Kako <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI Jaran</span> radi u pozadini
          </h2>
          <p className="text-gray-400 text-lg">
            Pogledaj kako sistem automatski preuzima upit, provjerava termine i rješava rezervaciju bez tvog prisustva.
          </p>
        </div>

        {/* Simulator Box */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden p-6 md:p-10">
          
          {/* Progress Steps Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`text-left p-4 rounded-2xl transition-all border cursor-pointer ${
                  activeStep === idx
                    ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-600/10"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{step.icon}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${step.badgeColor}`}>
                    Korak {idx + 1}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm md:text-base">{step.title}</h3>
                <p className="text-xs text-gray-400">{step.subtitle}</p>
              </button>
            ))}
          </div>

          {/* Active Screen Display */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-6 md:p-8 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-gray-500 ml-2 font-mono">ai-jaran-live-stream.exe</span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border ${steps[activeStep].badgeColor}`}>
                {steps[activeStep].badge}
              </span>
            </div>

            <div className="my-auto">
              <p className="text-lg md:text-2xl text-gray-200 font-medium leading-relaxed">
                "{steps[activeStep].content}"
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-xs text-gray-500">
              <span>Automatizacija u realnom vremenu</span>
              <span>AI Jaran Core v2.4</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}