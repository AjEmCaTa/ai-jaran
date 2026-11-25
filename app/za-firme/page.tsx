"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Hero from "../../components/Hero";
import Features from "../../components/Features";
import Comparison from "../../components/Comparison";
import CTASection from "../../components/CTASection";
import Footer from "../../components/Footer";
import { GENERAL_SUBJECT, useSite } from "../../components/site/siteContext";

// Stranica za vlasnike firmi: sadržaj koji je ranije bio na početnoj.
export default function ZaFirmePage() {
  const router = useRouter();
  const { openContact } = useSite();
  const [heroKey] = useState(0);

  useEffect(() => {
    document.title = "Za firme – POSLO ONE";
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">
      <Hero
        animationKey={heroKey}
        onStartFree={() => router.push("/cjenovnik")}
        onCatalogJoin={() => router.push("/#djelatnosti")}
        onHowItWorks={() => {
          document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <Features />
      <Comparison />
      <CTASection onDemoClick={() => router.push("/cjenovnik")} onContactClick={() => openContact(GENERAL_SUBJECT)} />
      <Footer />
    </main>
  );
}
