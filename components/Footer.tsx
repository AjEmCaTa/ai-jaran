"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface FooterProps {
  t?: any;
  brandName?: string;
  onOpenPrivacy?: () => void;
}

export default function Footer({ t, brandName = "AI JARAN", onOpenPrivacy }: FooterProps) {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative z-20 bg-[#02050f] border-t border-white/5 py-16 pb-20"
    >
      <div className="mx-auto max-w-6xl px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt={`${brandName} Logo`}
            width={40}
            height={40}
            className="rounded-xl"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-extrabold tracking-wider text-white text-lg">{brandName}</span>
        </div>

        <p className="text-xs md:text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} {brandName}. {t?.rights || "Sva prava zadržana. Razvijeno za moderne biznise."}
        </p>

        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">{t?.features || "Mogućnosti"}</a>
          <a href="#pricing" className="hover:text-white transition-colors">{t?.pricing || "Cijene"}</a>
          <button 
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-sm text-gray-400"
          >
            {t?.privacy || "Politika privatnosti"}
          </button>
        </div>
      </div>
    </motion.footer>
  );
}