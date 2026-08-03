"use client";

import { useState } from "react";
import { translations } from "./translations";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Benefits from "../components/Benefits";
import ChatDemo from "../components/ChatDemo";
import Comparison from "../components/Comparison";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ContactModal from "../components/ContactModal";
import CookieBanner from "../components/CookieBanner";
import PrivacyModal from "../components/PrivacyModal";

export default function Home() {
  const [lang, setLang] = useState<"BS" | "EN">("BS");
  const t = translations[lang === "BS" ? "bs" : "en"];

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Opšta pitanja / Konsultacije");
  const [heroKey, setHeroKey] = useState(0);

  const openContact = (planName: string = "Opšta pitanja / Konsultacije") => {
    setSelectedPlan(planName);
    setIsContactOpen(true);
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden">
      <Background />

      <Navbar 
        lang={lang}
        setLang={setLang}
        brandName={t.nav.brandName}
        onOpenContact={() => openContact("Opšta pitanja / Konsultacije")} 
        onResetHero={() => setHeroKey(prev => prev + 1)}
      />

      {/* 1. Upoznaj AI Jarana */}
      <Hero 
        t={t.hero}
        animationKey={heroKey}
        onStartFree={() => openContact("Jaran Starter (50 KM/mj)")}
        onHowItWorks={() => {
          document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* 2. Šta nudi */}
      <Features t={t.features} />

      {/* 3. Zašto baš AI Jaran */}
      <Benefits t={t.benefits} />

      {/* 4. Razlika koja donosi novac */}
      <Comparison t={t.comparison} />

      {/* 5. Kako AI Jaran radi u pozadini (ChatDemo) */}
      <div id="demo">
        <ChatDemo t={t.chatDemo} />
      </div>

      {/* 6. Cijene */}
      <Pricing t={t.pricing} onSelectPlan={openContact} />

      {/* 7. FAQ */}
      <FAQ t={t.faq} />
      
      <Footer 
        t={t.footer} 
        brandName={t.nav.brandName} 
        onOpenPrivacy={() => setIsPrivacyOpen(true)} 
      />

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        defaultSubject={selectedPlan}
        t={t.contactModal}
      />

      <PrivacyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
        t={t.privacy}
      />

      <CookieBanner t={t.cookie} />
    </main>
  );
}