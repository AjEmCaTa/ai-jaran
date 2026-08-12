"use client";

import Image from "next/image";
import { useState } from "react";

interface NavbarProps {
  onOpenContact: () => void;
  onResetHero: () => void;
  onOpenCatalog?: () => void;
  brandName: string;
  lang: "BS" | "EN";
  setLang: (lang: "BS" | "EN") => void;
}

export default function Navbar({ onOpenContact, onResetHero, onOpenCatalog, brandName, lang, setLang }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: lang === "BS" ? "Početna" : "Home", id: "#" },
    { name: lang === "BS" ? "Demo" : "Demo", id: "#chat-demo" },
    { name: lang === "BS" ? "Usluge" : "Services", id: "#features" },
    { name: lang === "BS" ? "Cijene" : "Pricing", id: "#pricing" },
    { name: lang === "BS" ? "FAQ" : "FAQ", id: "#faq" }
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string, name: string) => {
    e.preventDefault();
    setIsOpen(false);

    if (name === "Početna" || name === "Home" || id === "#") {
      onResetHero();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const targetElement = document.querySelector(id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/5">
      <div className="w-full px-8 h-24 flex items-center justify-between">
        
        {/* LOGO - SKROZ LIJEVO */}
        <a 
          href="#" 
          onClick={(e) => handleNavClick(e, "#", lang === "BS" ? "Početna" : "Home")} 
          className="flex items-center gap-3.5 cursor-pointer"
        >
          <Image
            src="/logo.png"
            alt="AI Jaran Logo"
            width={48}
            height={48}
            className="rounded-2xl"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-extrabold tracking-wider text-white text-xl">{brandName}</span>
        </a>

        {/* DESNI DIO: Linkovi + Biznisi + Jezik + Kontakt - SKROZ DESNO */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a 
              key={item.name} 
              href={item.id} 
              onClick={(e) => handleNavClick(e, item.id, item.name)}
              className="text-base font-medium text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {item.name}
            </a>
          ))}

          {/* Dugme za Biznise */}
          <button
            onClick={onOpenCatalog}
            className="text-base font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-200 cursor-pointer flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/10"
          >
            <span>{lang === "BS" ? "Biznisi" : "Businesses"}</span>
          </button>
          
          {/* Prekidač za jezik */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setLang("BS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                lang === "BS" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              BS
            </button>
            <button
              onClick={() => setLang("EN")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                lang === "EN" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          {/* Kontakt dugme */}
          <button
            onClick={onOpenContact}
            className="px-7 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer text-base"
          >
            {lang === "BS" ? "Kontakt" : "Contact"}
          </button>
        </div>

        {/* Mobilni Meni Dugme i Jezik */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setLang("BS")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${lang === "BS" ? "bg-blue-600 text-white" : "text-gray-400"}`}
            >
              BS
            </button>
            <button
              onClick={() => setLang("EN")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${lang === "EN" ? "bg-blue-600 text-white" : "text-gray-400"}`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none cursor-pointer transition-colors hover:bg-white/10"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="w-5 h-4 flex flex-col justify-between items-center">
                <span className="w-full h-0.5 bg-white rounded-full" />
                <span className="w-full h-0.5 bg-white rounded-full" />
                <span className="w-full h-0.5 bg-white rounded-full" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobilni Meni */}
      {isOpen && (
        <div className="md:hidden bg-[#030712] border-b border-white/5 px-8 py-6 flex flex-col gap-6 shadow-2xl animate-fade-in">
          {navLinks.map((item) => (
            <a 
              key={item.name} 
              href={item.id} 
              onClick={(e) => handleNavClick(e, item.id, item.name)} 
              className="text-gray-300 hover:text-white text-base font-medium transition-colors"
            >
              {item.name}
            </a>
          ))}
          
          <button 
            onClick={() => { setIsOpen(false); if(onOpenCatalog) onOpenCatalog(); }} 
            className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold cursor-pointer"
          >
            {lang === "BS" ? "Katalog Biznisa" : "Business Directory"}
          </button>

          <button 
            onClick={() => { setIsOpen(false); onOpenContact(); }} 
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            {lang === "BS" ? "Kontaktirajte nas" : "Contact Us"}
          </button>
        </div>
      )}
    </nav>
  );
}