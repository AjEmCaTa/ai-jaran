"use client";

import { useEffect } from "react";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";

export default function FaqPage() {
  useEffect(() => {
    document.title = "Česta pitanja – POSLO ONE";
  }, []);
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] pt-20 font-sans text-white">
      <FAQ />
      <Footer />
    </main>
  );
}
