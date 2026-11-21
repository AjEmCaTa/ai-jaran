"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Comparison from "../components/Comparison";
import FAQ from "../components/FAQ";
import FounderSection from "../components/FounderSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";
import { GENERAL_SUBJECT, useSite } from "../components/site/siteContext";

export default function Home() {
  const router = useRouter();
  const { openContact } = useSite();
  const [heroKey, setHeroKey] = useState(0);

  // Klik na logo na početnoj ponovo pokrene animaciju naslova.
  useEffect(() => {
    const reset = () => setHeroKey((k) => k + 1);
    window.addEventListener("poslo:reset-hero", reset);
    return () => window.removeEventListener("poslo:reset-hero", reset);
  }, []);

  // Otvori kontakt kada se dođe sa /cjenovnik, npr. /?contact=true&plan=starter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("contact") !== "true") return;
    const plan = params.get("plan");
    openContact(plan === "starter" ? "Starter" : plan === "pro" ? "POSLO ONE Pro (50 KM)" : GENERAL_SUBJECT);
    window.history.replaceState({}, "", "/");
  }, [openContact]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">
      <Hero
        animationKey={heroKey}
        onStartFree={() => router.push("/cjenovnik")}
        onCatalogJoin={() => router.push("/katalog")}
        onHowItWorks={() => {
          document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <Features />
      <Comparison />
      <FounderSection />
      <CTASection onDemoClick={() => router.push("/cjenovnik")} onContactClick={() => openContact(GENERAL_SUBJECT)} />
      <FAQ />
      <Footer />
    </main>
  );
}
