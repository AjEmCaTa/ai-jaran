"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "./site/LangProvider";

const TEXT = {
  bs: { rights: "Sva prava zadržana.", forBusiness: 'Za firme', about: 'O nama', faq: 'FAQ', pricing: "Cjenovnik", businesses: "Biznisi", terms: "Uslovi korištenja", privacy: "Politika privatnosti", refund: "Povrat novca" },
  en: { rights: "All rights reserved.", forBusiness: 'For businesses', about: 'About', faq: 'FAQ', pricing: "Pricing", businesses: "Businesses", terms: "Terms of use", privacy: "Privacy policy", refund: "Refunds" },
};

interface FooterProps {
  // Ostavljen zbog kompatibilnosti sa starim stranicama.
  // Footer uvijek koristi POSLO ONE kao glavni brand.
  brandName?: string;
  onOpenPrivacy?: () => void;
}

// onOpenPrivacy ostaje u tipu radi starih poziva; politika je sada stranica /privatnost.
export default function Footer(_props: FooterProps) {
  const pathname = usePathname();
  const t = useT(TEXT);

  const isCatalog = pathname.startsWith("/katalog");
  const isPricing = pathname === "/cjenovnik";

  const brandName = "POSLO ONE";

  return (
    <footer className="relative z-20 border-t border-white/5 bg-[#030712] py-12 pb-20 sm:py-16">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center justify-between gap-6 px-6 sm:px-8 md:flex-row lg:px-12 xl:px-16">

        {/* LOGO I NAZIV - Vraća na početnu */}
        <Link
          href="/"
          className="group flex cursor-pointer items-center gap-3"
        >
          <Image
            src="/poslo.one.png"
            alt={`${brandName} Logo`}
            width={40}
            height={40}
            className="relative"
            style={{
              mixBlendMode: "screen",
            }}
          />

          <span className="text-lg font-extrabold tracking-wider text-white transition-colors group-hover:text-blue-400">
            {brandName}
          </span>
        </Link>

        {/* COPYRIGHT */}
        <p className="text-center text-xs text-gray-500 md:text-sm">
          &copy; {new Date().getFullYear()} {brandName}. {t.rights}
        </p>

        {/* NAVIGACIONI LINKOVI */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">

          <Link href="/za-firme" className="py-2 transition-colors hover:text-white">
            {t.forBusiness}
          </Link>
          <Link href="/o-nama" className="py-2 transition-colors hover:text-white">
            {t.about}
          </Link>
          <Link href="/faq" className="py-2 transition-colors hover:text-white">
            {t.faq}
          </Link>

          {/* CJENOVNIK - sakrij na stranici cjenovnika */}
          {!isPricing && (
            <Link
              href="/cjenovnik"
              className="py-2 transition-colors hover:text-white"
            >
              {t.pricing}
            </Link>
          )}

          {/* BIZNISI - sakrij na katalog stranicama */}
          {!isCatalog && (
            <Link
              href="/katalog"
              className="py-2 transition-colors hover:text-white"
            >
              {t.businesses}
            </Link>
          )}

          {/* PRAVNE STRANICE */}
          <Link href="/uslovi" className="py-2 transition-colors hover:text-white">
            {t.terms}
          </Link>
          <Link href="/privatnost" className="py-2 transition-colors hover:text-white">
            {t.privacy}
          </Link>
          <Link href="/povrat-novca" className="py-2 transition-colors hover:text-white">
            {t.refund}
          </Link>

          {/* INSTAGRAM */}
          <a
            href="https://www.instagram.com/poslo.one?stkn=MXV5eGI2b2t5cHc2cw%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-400 transition-colors hover:text-blue-400"
            title="Instagram"
            aria-label="POSLO ONE Instagram"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
              />

              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />

              <line
                x1="17.5"
                y1="6.5"
                x2="17.51"
                y2="6.5"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}