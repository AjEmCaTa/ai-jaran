"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavbarProps {
  onOpenContact: () => void;
  onResetHero?: () => void;
  onOpenCatalog?: () => void;
  brandName: string;
}

export default function Navbar({
  onOpenContact,
  onResetHero,
  onOpenCatalog,
  brandName,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const handleSmoothScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setIsOpen(false);
    if (!isHome) {
      router.push(`/${targetId}`);
    } else {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLogoOrHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (!isHome) {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (onResetHero) onResetHero();
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#030712]/75 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex h-[82px] w-full max-w-[1500px] items-center justify-between px-6 sm:px-8 lg:px-12 xl:px-16">
        
        {/* LOGO */}
        <a
          href="/"
          onClick={handleLogoOrHomeClick}
          className="group flex cursor-pointer items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-blue-500/30 blur-lg transition-all duration-300 group-hover:bg-blue-500/50" />
            <Image
              src="/logo.png"
              alt="AI Jaran Logo"
              width={42}
              height={42}
              priority
              className="relative rounded-xl"
              style={{
                mixBlendMode: "screen",
              }}
            />
          </div>

          <span className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
            {brandName}
          </span>
        </a>

        {/* DESKTOP NAVIGACIJA */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="/"
            onClick={handleLogoOrHomeClick}
            className="cursor-pointer text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
          >
            Početna
          </a>

          <a
            href="/#faq"
            onClick={(e) => handleSmoothScroll(e, "#faq")}
            className="cursor-pointer text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
          >
            FAQ
          </a>

          <Link
            href="/cjenovnik"
            className="cursor-pointer text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
          >
            Cjenovnik
          </Link>

          {/* Biznisi dugme - DIREKTNO NA /katalog */}
          <Link
            href="/katalog"
            className="cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2 text-sm font-semibold text-emerald-400 transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-500/10"
          >
            Biznisi
          </Link>

          {/* Dashboard / Panel prečica */}
          <Link
            href="/prijava"
            className="cursor-pointer rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 transition-all duration-300 hover:bg-blue-500/20"
          >
            Moj Panel
          </Link>

          {/* Kontakt */}
          <button
            onClick={onOpenContact}
            className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-600/30"
          >
            Kontakt
          </button>
        </div>

        {/* MOBILE HAMBURGER */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="flex h-4 w-5 flex-col justify-between">
                <span className="h-0.5 w-full rounded-full bg-white" />
                <span className="h-0.5 w-full rounded-full bg-white" />
                <span className="h-0.5 w-full rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="border-t border-white/[0.05] bg-[#030712]/98 px-6 py-8 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-5">
            <a
              href="/"
              onClick={handleLogoOrHomeClick}
              className="text-base font-semibold text-slate-200 hover:text-white"
            >
              Početna
            </a>
            
            <a
              href="/#faq"
              onClick={(e) => handleSmoothScroll(e, "#faq")}
              className="text-base font-semibold text-slate-200 hover:text-white"
            >
              FAQ
            </a>

            <Link
              href="/cjenovnik"
              onClick={() => setIsOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-white"
            >
              Cjenovnik
            </Link>

            <Link
              href="/prijava"
              onClick={() => setIsOpen(false)}
              className="text-base font-bold text-blue-400 hover:text-blue-300"
            >
              Moj Panel
            </Link>

            <Link
              href="/katalog"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] py-3.5 text-center text-base font-semibold text-emerald-400"
            >
              Katalog Biznisa
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenContact();
              }}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-center text-base font-bold text-white shadow-lg"
            >
              Kontakt
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}