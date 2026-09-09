"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Comparison from "../components/Comparison";
import FAQ from "../components/FAQ";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ContactModal from "../components/ContactModal";
import CookieBanner from "../components/CookieBanner";
import PrivacyModal from "../components/PrivacyModal";

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(
    "Opšta pitanja / Konsultacije"
  );

  const [heroKey, setHeroKey] = useState(0);

  const openContact = (
    planName: string = "Opšta pitanja / Konsultacije"
  ) => {
    setSelectedPlan(planName);
    setIsContactOpen(true);
  };

  // Otvori ContactModal kada se dođe sa /cjenovnik
  // npr. /?contact=true&plan=starter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const contact = params.get("contact");
    const plan = params.get("plan");

    if (contact === "true") {
      if (plan === "starter") {
        openContact("Starter");
      } else if (plan === "pro") {
        openContact("POSLO ONE Pro (50 KM)");
      } else {
        openContact("Opšta pitanja / Konsultacije");
      }

      // Očisti URL nakon otvaranja modala
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />

      <Navbar
        onOpenContact={() =>
          openContact("Opšta pitanja / Konsultacije")
        }
        onResetHero={() => {
          setHeroKey((prev) => prev + 1);
        }}
        onOpenCatalog={() => {
          window.location.href = "/katalog";
        }}
      />

      <Hero
        animationKey={heroKey}
        onStartFree={() => {
          window.location.href = "/cjenovnik";
        }}
        onCatalogJoin={() => {
          window.location.href = "/katalog";
        }}
        onHowItWorks={() => {
          document
            .getElementById("demo")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <Features />

      <Comparison />

      <CTASection
        onDemoClick={() => {
          window.location.href = "/cjenovnik";
        }}
        onContactClick={() => {
          openContact("Opšta pitanja / Konsultacije");
        }}
      />

      <FAQ />

      <Footer
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultSubject={selectedPlan}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <CookieBanner
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />
    </main>
  );
}