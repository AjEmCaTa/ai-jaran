"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="relative z-20 bg-[#02050f] border-t border-white/5 py-16 pb-20"
    >
      <div className="mx-auto max-w-6xl px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="AI Jaran Logo"
            width={40}
            height={40}
            className="rounded-xl"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-extrabold tracking-wider text-white text-lg">AI JARAN</span>
        </div>

        <p className="text-xs md:text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} AI Jaran. Sva prava zadržana. Razvijeno za moderne biznise.
        </p>

        <div className="flex gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Mogućnosti</a>
          <a href="#pricing" className="hover:text-white transition-colors">Cijene</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Kako radi</a>
        </div>
      </div>
    </motion.footer>
  );
}