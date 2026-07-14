"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

interface NavbarProps {
  onOpenContact: () => void;
  onResetHero: () => void; // Dodao sam ovo
}

export default function Navbar({ onOpenContact, onResetHero }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="AI Jaran Logo"
            width={40}
            height={40}
            className="rounded-xl"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-extrabold tracking-wider text-white text-lg">AI JARAN</span>
        </a>

        {/* Desktop Linkovi */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: "Početna", id: "#" },
            { name: "Mogućnosti", id: "#features" },
            { name: "Kako radi", id: "#how-it-works" },
            { name: "Cijene", id: "#pricing" },
            { name: "FAQ", id: "#faq" }
          ].map((item) => (
            <a 
              key={item.name} 
              href={item.id} 
              onClick={() => {
                if (item.name === "Početna") {
                  onResetHero(); // Ovo resetuje animaciju!
                }
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
          
          <button
            onClick={onOpenContact}
            className="px-6 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
          >
            Kontakt
          </button>
        </div>

        {/* Mobilni Meni Dugme */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-white"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobilni Meni */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-[#030712] border-b border-white/5 px-8 py-6 flex flex-col gap-6"
        >
          {[
            { name: "Početna", id: "#" },
            { name: "Mogućnosti", id: "#features" },
            { name: "Kako radi", id: "#how-it-works" },
            { name: "Cijene", id: "#pricing" },
            { name: "FAQ", id: "#faq" }
          ].map((item) => (
            <a 
              key={item.name} 
              href={item.id} 
              onClick={() => {
                setIsOpen(false);
                if (item.name === "Početna") onResetHero();
              }} 
              className="text-gray-400"
            >
              {item.name}
            </a>
          ))}
          <button onClick={() => { setIsOpen(false); onOpenContact(); }} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold">
            Kontakt
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
}