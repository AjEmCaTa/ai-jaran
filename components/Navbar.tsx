"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import InstallButton from "./InstallButton";
import AuthNavButton from "./AuthNavButton";

interface NavbarProps {
  onOpenContact: () => void;
  onResetHero?: () => void;
  onOpenCatalog?: () => void;
}

export default function Navbar({
  onOpenContact,
  onResetHero,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";
  const isPricing = pathname === "/cjenovnik";
  const isCatalog = pathname === "/katalog";

  const handleSmoothScroll = (
    e: React.MouseEvent,
    targetId: string
  ) => {
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
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      if (onResetHero) {
        onResetHero();
      }
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#030712]/75 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex h-[82px] w-full max-w-[1500px] items-center justify-between px-6 sm:px-8 lg:px-12 xl:px-16">

        {/* LOGO */}
        <Link
          href="/"
          onClick={handleLogoOrHomeClick}
          className="group flex cursor-pointer items-center gap-3"
        >
          <div className="relative h-[50px] w-[50px] overflow-hidden">
  <Image
    src="/poslo.one.png"
    alt="POSLO ONE Logo"
    width={90}
    height={60}
    priority
    className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
    style={{
      mixBlendMode: "screen",
    }}
  />
</div>

          <span className="text-[20px] leading-none font-extrabold tracking-tight text-white">
            POSLO ONE
          </span>
        </Link>

        {/* DESKTOP NAVIGACIJA */}
        <div className="hidden items-center gap-6 md:flex">

          <Link
            href="/"
            onClick={handleLogoOrHomeClick}
            className="cursor-pointer text-[14px] leading-none font-medium text-slate-400 transition-colors duration-200 hover:text-white"
          >
            Početna
          </Link>

          <Link
            href="/#faq"
            onClick={(e) => handleSmoothScroll(e, "#faq")}
            className="cursor-pointer text-[14px] leading-none font-medium text-slate-400 transition-colors duration-200 hover:text-white"
          >
            FAQ
          </Link>

          {/* CJENOVNIK - ne prikazuj na stranici cjenovnika */}
          {!isPricing && (
            <Link
              href="/cjenovnik"
              className="cursor-pointer text-[14px] leading-none font-medium text-slate-400 transition-colors duration-200 hover:text-white"
            >
              Cjenovnik
            </Link>
          )}

          {/* BIZNISI - ne prikazuj na katalog stranici */}
          {!isCatalog && (
            <Link
              href="/katalog"
              className="cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2 text-[14px] leading-none font-semibold text-emerald-400 transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              Biznisi
            </Link>
          )}

          <Link
            href="/dashboard"
            className="cursor-pointer rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[14px] leading-none font-semibold text-blue-400 transition-all duration-300 hover:bg-blue-500/20"
          >
            Moj Panel
          </Link>

          {/* PRIJAVA / MOJ NALOG (za klijente) */}
          <AuthNavButton variant="desktop" />

          <button
            onClick={onOpenContact}
            className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-[14px] leading-none font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-600/30"
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
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
        <div className="border-t border-white/[0.05] bg-[#030712]/98 px-6 py-6 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-4">

            <Link
              href="/"
              onClick={handleLogoOrHomeClick}
              className="py-1 text-base font-medium text-slate-300 hover:text-white"
            >
              Početna
            </Link>

            <Link
              href="/#faq"
              onClick={(e) => handleSmoothScroll(e, "#faq")}
              className="py-1 text-base font-medium text-slate-300 hover:text-white"
            >
              FAQ
            </Link>

            {/* CJENOVNIK - ne prikazuj na stranici cjenovnika */}
            {!isPricing && (
              <Link
                href="/cjenovnik"
                onClick={() => setIsOpen(false)}
                className="py-1 text-base font-medium text-slate-300 hover:text-white"
              >
                Cjenovnik
              </Link>
            )}

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="py-1 text-base font-semibold text-blue-400 hover:text-blue-300"
            >
              Moj Panel
            </Link>

            {/* PRIJAVA / MOJ NALOG (za klijente) */}
            <AuthNavButton variant="mobile" onClick={() => setIsOpen(false)} />

            {/* BIZNISI - ne prikazuj na katalog stranici */}
            {!isCatalog && (
              <Link
                href="/katalog"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] py-3 text-center text-sm font-semibold text-emerald-400"
              >
                Biznisi
              </Link>
            )}

            {/* PWA Install Button integrisan u mobilni meni */}
            <InstallButton />

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenContact();
              }}
              className="w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-bold text-white shadow-lg"
            >
              Kontakt
            </button>

          </div>
        </div>
      )}
    </nav>
  );
}