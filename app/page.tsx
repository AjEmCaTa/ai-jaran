"use client";

import { useState } from "react";
import Preloader from "../components/Preloader";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Benefits from "../components/Benefits";
import ChatDemo from "../components/ChatDemo";
import Pricing from "../components/Pricing";
import HowItWorks from "../components/HowItWorks";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ContactModal from "../components/ContactModal";

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Opšta pitanja / Konsultacije");
  
  // Ovo je ključ za animaciju
  const [heroKey, setHeroKey] = useState(0);

  const openContact = (planName: string = "Opšta pitanja / Konsultacije") => {
    setSelectedPlan(planName);
    setIsContactOpen(true);
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden">
      <Preloader />
      <Background />

      {/* OVDJE JE DODANO onResetHero DA NE IZBACUJE VIŠE GREŠKU */}
      <Navbar 
        onOpenContact={() => openContact("Opšta pitanja / Konsultacije")} 
        onResetHero={() => setHeroKey(prev => prev + 1)}
      />

      <Hero 
        animationKey={heroKey}
        onStartFree={() => openContact("Jaran Starter (50 KM/mj)")} 
      />

      <Features />
      <Benefits />
      <ChatDemo />
      <HowItWorks />
      <Pricing onSelectPlan={openContact} />
      <FAQ />
      <Footer />

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        defaultSubject={selectedPlan}
      />
    </main>
  );
}