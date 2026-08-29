"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterProps {
  t?: any;
  brandName?: string;
  onOpenPrivacy?: () => void;
}

export default function Footer({ t, brandName = "AI JARAN", onOpenPrivacy }: FooterProps) {
  const pathname = usePathname();
  const isCatalog = pathname.startsWith("/katalog");

  return (
    <footer className="relative z-20 bg-[#030712] border-t border-white/5 py-16 pb-20">
      <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-8 lg:px-12 xl:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Logo i naziv - Vraća na početnu */}
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
          &copy; {new Date().getFullYear()} {brandName}. {t?.rights || "Sva prava zadržana."}
        </p>

        {/* Navigacioni linkovi */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/cjenovnik" className="hover:text-white transition-colors">
            Cjenovnik
          </Link>
          
          {/* Sakrij "Biznisi" link kad se nalazimo u katalogu */}
          {!isCatalog && (
            <Link href="/katalog" className="hover:text-white transition-colors">
              Biznisi
            </Link>
          )}

          <button 
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-sm text-gray-400"
          >
            Politika privatnosti
          </button>
          
          {/* Instagram ikonica sa tvojim pravim linkom */}
          <a 
            href="https://www.instagram.com/ai.jaran?igsi=MXV5eGI2b2t5cHc2cw%3D%3D&utm_source=qr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors flex items-center text-gray-400"
            title="Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}