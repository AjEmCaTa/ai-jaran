"use client";

import Image from "next/image";
import Link from "next/link";

interface FooterProps {
  t?: any;
  brandName?: string;
  onOpenPrivacy?: () => void;
}

export default function Footer({ t, brandName = "AI JARAN", onOpenPrivacy }: FooterProps) {
  return (
    <footer className="relative z-20 bg-[#030712] border-t border-white/5 py-16 pb-20">
      <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-8 lg:px-12 xl:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Logo i naziv (ovdje je već link ka /) */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <Image
            src="/logo.png"
            alt={`${brandName} Logo`}
            width={40}
            height={40}
            className="rounded-xl"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="font-extrabold tracking-wider text-white text-lg group-hover:text-blue-400 transition-colors">
            {brandName}
          </span>
        </Link>

        {/* Copyright */}
        <p className="text-xs md:text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} {brandName}. {t?.rights || "Sva prava zadržana. Razvijeno za moderne biznise."}
        </p>

        {/* Korisni linkovi bez Početne */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/cjenovnik" className="hover:text-white transition-colors">
            {t?.pricing || "Cjenovnik"}
          </Link>
          <Link href="/katalog" className="hover:text-white transition-colors">
            {t?.catalog || "Biznisi"}
          </Link>
          <button 
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-sm text-gray-400"
          >
            {t?.privacy || "Politika privatnosti"}
          </button>
        </div>
      </div>
    </footer>
  );
}