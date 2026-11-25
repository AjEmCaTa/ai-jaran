"use client";

import { useEffect } from "react";
import FounderSection from "../../components/FounderSection";
import Footer from "../../components/Footer";

export default function ONamaPage() {
  useEffect(() => {
    document.title = "O nama – POSLO ONE";
  }, []);
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] pt-20 font-sans text-white">
      <FounderSection />
      <Footer />
    </main>
  );
}
