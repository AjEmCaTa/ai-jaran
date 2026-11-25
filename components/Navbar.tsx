"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import InstallButton from "./InstallButton";
import AuthNavButton from "./AuthNavButton";
import { useLang, useT } from "./site/LangProvider";
import { useSite } from "./site/siteContext";

// Stari pozivi još šalju ove propse; meni ih više ne treba (živi u SiteShell).
interface NavbarProps {
  onOpenContact?: () => void;
  onResetHero?: () => void;
  onOpenCatalog?: () => void;
}

const TEXT = {
  bs: { home: "Početna", business: "Za firme", about: "O nama", faq: "FAQ", pricing: "Cjenovnik", businesses: "Biznisi", panel: "Moj Panel", contact: "Kontakt", menu: "Otvori meni", close: "Zatvori meni" },
  en: { home: "Home", business: "For businesses", about: "About", faq: "FAQ", pricing: "Pricing", businesses: "Businesses", panel: "My Panel", contact: "Contact", menu: "Open menu", close: "Close menu" },
};

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Jezik / Language"
      className={`relative flex shrink-0 items-center rounded-xl border border-white/10 bg-white/[0.04] p-1 font-bold ${compact ? "h-11 text-[12px]" : "h-10 text-[12px]"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-blue-600 transition-transform duration-300 ease-out ${lang === "en" ? "translate-x-full" : "translate-x-0"}`}
        style={{ left: 4 }}
      />
      {(["bs", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`relative z-10 h-full w-9 cursor-pointer rounded-lg transition-colors duration-300 ${lang === l ? "text-white" : "text-slate-400 hover:text-white"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Navbar(_props: NavbarProps) {
  const t = useT(TEXT);
  const { openContact } = useSite();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const closeTimer = useRef<number | null>(null);

  // Dok je meni otvoren, stranica ispod se ne pomjera.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Meni se zatvori tek kad je nova stranica spremna, pa se ne vidi skok stare stranice.
  useEffect(() => {
    setIsOpen(false);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, [pathname]);

  const closeSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 1200);
  };

  const isHome = pathname === "/";
  const isPricing = pathname === "/cjenovnik";

  const handleLogoOrHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isHome) {
      closeSoon();
      router.push("/");
      return;
    }
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.dispatchEvent(new Event("poslo:reset-hero"));
  };

  const mobileLink =
    "flex min-h-[58px] items-center justify-between font-sans text-[15px] font-extrabold uppercase tracking-[0.2em] transition-[opacity,transform,color] duration-300 ease-out";
  // Stavke menija ulaze jedna za drugom.
  const stagger = (i: number) => ({
    transitionDelay: isOpen ? `${60 + i * 35}ms` : "0ms",
  });
  const itemState = isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0";

  const mobileItems = [
    { key: "home", href: "/", label: t.home, onClick: handleLogoOrHomeClick, show: true, accent: false },
    { key: "business", href: "/za-firme", label: t.business, onClick: closeSoon, show: pathname !== "/za-firme", accent: false },
    { key: "pricing", href: "/cjenovnik", label: t.pricing, onClick: closeSoon, show: !isPricing, accent: false },
    { key: "about", href: "/o-nama", label: t.about, onClick: closeSoon, show: pathname !== "/o-nama", accent: false },
    { key: "faq", href: "/faq", label: t.faq, onClick: closeSoon, show: pathname !== "/faq", accent: false },
  ].filter((i) => i.show);

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] transition-colors duration-300 ${isOpen ? "bg-[#030712]" : "bg-[#030712]/75 backdrop-blur-2xl"}`}>
      <div className="mx-auto flex h-[82px] w-full max-w-[1500px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-12 xl:px-16">

        {/* LOGO */}
        <Link href="/" onClick={handleLogoOrHomeClick} className="group flex min-w-0 cursor-pointer items-center gap-2.5">
          <div className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center">
            <Image
              src="/poslo.one.png"
              alt="POSLO ONE Logo"
              width={44}
              height={44}
              priority
              className="h-[44px] w-[44px] object-contain"
            />
          </div>
          <span className="whitespace-nowrap text-[20px] font-extrabold leading-none tracking-tight text-white">POSLO ONE</span>
        </Link>

        {/* DESKTOP NAVIGACIJA */}
        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/" onClick={handleLogoOrHomeClick} className="cursor-pointer text-[14px] font-medium leading-none text-slate-400 transition-colors duration-200 hover:text-white">
            {t.home}
          </Link>
          <Link href="/za-firme" className="cursor-pointer text-[14px] font-medium leading-none text-slate-400 transition-colors duration-200 hover:text-white">
            {t.business}
          </Link>
          {!isPricing && (
            <Link href="/cjenovnik" className="cursor-pointer text-[14px] font-medium leading-none text-slate-400 transition-colors duration-200 hover:text-white">
              {t.pricing}
            </Link>
          )}
          <Link href="/o-nama" className="cursor-pointer text-[14px] font-medium leading-none text-slate-400 transition-colors duration-200 hover:text-white">
            {t.about}
          </Link>
          <Link href="/faq" className="cursor-pointer text-[14px] font-medium leading-none text-slate-400 transition-colors duration-200 hover:text-white">
            {t.faq}
          </Link>
          <Link href="/dashboard" className="cursor-pointer rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[14px] font-semibold leading-none text-blue-400 transition-all duration-300 hover:bg-blue-500/20">
            {t.panel}
          </Link>
          <AuthNavButton variant="desktop" />
          <LangSwitch />
          <button
            onClick={() => openContact()}
            className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-[14px] font-bold leading-none text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-600/30"
          >
            {t.contact}
          </button>
        </div>

        {/* MOBILNO: jezik + meni */}
        <div className="flex items-center gap-2 lg:hidden">
          <LangSwitch compact />
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
            aria-label={isOpen ? t.close : t.menu}
            aria-expanded={isOpen}
          >
            <span className="relative block h-4 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-full rounded-full bg-white transition-transform duration-300 ease-out ${isOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-[7px] h-0.5 w-full rounded-full bg-white transition-opacity duration-200 ${isOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 top-[14px] h-0.5 w-full rounded-full bg-white transition-transform duration-300 ease-out ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* MOBILNI MENI (uvijek postoji, samo se glatko pojavi i nestane) */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-x-0 bottom-0 top-[82px] flex flex-col overflow-y-auto overscroll-contain bg-[#030712] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 transition-[opacity,visibility] duration-300 ease-out lg:hidden ${isOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
      >
        <div className="flex flex-col divide-y divide-white/[0.05]">
          {mobileItems.map((item, i) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              tabIndex={isOpen ? 0 : -1}
              style={stagger(i)}
              className={`${mobileLink} ${itemState} ${item.accent ? "text-emerald-400 hover:text-emerald-300" : "text-white hover:text-blue-300"}`}
            >
              {item.label}
              <span aria-hidden="true" className={`text-lg ${item.accent ? "text-emerald-700" : "text-slate-600"}`}>›</span>
            </Link>
          ))}
        </div>

        <div style={stagger(mobileItems.length)} className={`mt-6 flex flex-col gap-2.5 transition-[opacity,transform] duration-300 ease-out ${itemState}`}>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              onClick={closeSoon}
              tabIndex={isOpen ? 0 : -1}
              className="flex h-12 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm font-semibold text-blue-300 hover:bg-blue-500/20"
            >
              {t.panel}
            </Link>
            <AuthNavButton variant="mobile" onClick={closeSoon} />
          </div>

          <InstallButton />

          <button
            onClick={() => {
              setIsOpen(false);
              openContact();
            }}
            tabIndex={isOpen ? 0 : -1}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white"
          >
            {t.contact}
          </button>
        </div>

        <div className="mt-auto pt-10 text-center text-xs text-slate-500">
          <a href="mailto:info@poslo.one" className="hover:text-slate-300">info@poslo.one</a>
          <span className="mx-2">·</span>
          <a href="tel:0603050153" className="hover:text-slate-300">060 30 50 153</a>
        </div>
      </div>
    </nav>
  );
}
