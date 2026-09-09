"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterProps {
  // Ostavljen zbog kompatibilnosti sa starim stranicama.
  // Footer uvijek koristi POSLO ONE kao glavni brand.
  brandName?: string;
  onOpenPrivacy?: () => void;
}

export default function Footer({
  onOpenPrivacy,
}: FooterProps) {
  const pathname = usePathname();

  const isCatalog = pathname.startsWith("/katalog");
  const isPricing = pathname === "/cjenovnik";

  const brandName = "POSLO ONE";

  return (
    <footer className="relative z-20 border-t border-white/5 bg-[#030712] py-16 pb-20">
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
          &copy; {new Date().getFullYear()} {brandName}. Sva prava zadržana.
        </p>

        {/* NAVIGACIONI LINKOVI */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">

          {/* CJENOVNIK - sakrij na stranici cjenovnika */}
          {!isPricing && (
            <Link
              href="/cjenovnik"
              className="transition-colors hover:text-white"
            >
              Cjenovnik
            </Link>
          )}

          {/* BIZNISI - sakrij na katalog stranicama */}
          {!isCatalog && (
            <Link
              href="/katalog"
              className="transition-colors hover:text-white"
            >
              Biznisi
            </Link>
          )}

          {/* POLITIKA PRIVATNOSTI */}
          <button
            onClick={onOpenPrivacy}
            className="cursor-pointer border-none bg-transparent p-0 text-sm text-gray-400 transition-colors hover:text-white"
          >
            Politika privatnosti
          </button>

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