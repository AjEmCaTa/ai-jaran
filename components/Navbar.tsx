"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onOpenContact: () => void;
  onResetHero: () => void;
  brandName: string;
  lang: "BS" | "EN";
  setLang: (lang: "BS" | "EN") => void;
}

export default function Navbar({ onOpenContact, onResetHero, brandName, lang, setLang }: NavbarProps) {
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
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <a 
          href="#" 
          onClick={(e) => handleNavClick(e, "#", lang === "BS" ? "Početna" : "Home")} 
          className="flex items-center gap-3 cursor-pointer"
        >
          <Image
            src="/logo.png"
            alt="AI Jaran Logo"
            width={40}
            height={40}
            className="rounded-xl"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-extrabold tracking-wider text-white text-lg">{brandName}</span>
        </a>

        {/* Desktop Linkovi */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a 
              key={item.name} 
              href={item.id} 
              onClick={(e) => handleNavClick(e, item.id, item.name)}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {item.name}
            </a>
          ))}
          
          {/* Elegantni prekidač za jezik */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setLang("BS")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                lang === "BS" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              BS
            </button>
            <button
              onClick={() => setLang("EN")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                lang === "EN" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={onOpenContact}
            className="px-6 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer"
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
            className="p-2 text-white focus:outline-none cursor-pointer"
          >
            <div className="w-6 h-5 flex flex-col justify-between items-center">
              <span className={`w-full h-0.5 bg-white transition-transform duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`w-full h-0.5 bg-white transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`} />
              <span className={`w-full h-0.5 bg-white transition-transform duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobilni Meni */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-[#030712] border-b border-white/5 px-8 py-6 flex flex-col gap-6 overflow-hidden shadow-2xl"
          >
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
              onClick={() => { setIsOpen(false); onOpenContact(); }} 
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {lang === "BS" ? "Kontaktirajte nas" : "Contact Us"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}