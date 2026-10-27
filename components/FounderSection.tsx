"use client";

import Image from "next/image";
import { useState } from "react";

// Fotografiju osnivača zamijeni tako što zamijeniš fajl
// public/founder/harun-catic.jpg (ista putanja, bez izmjene koda).
const FOUNDER_PHOTO = "/founder/harun-catic.jpg";
const FOUNDER_NAME = "Harun Ćatić";
const FOUNDER_INITIALS = "HĆ";
const LINKEDIN_URL =
  "https://www.linkedin.com/in/harun-%C4%87ati%C4%87-a56045397";

export default function FounderSection() {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section
      id="osnivac"
      className="py-28 px-6 sm:px-8 bg-[#030712] relative z-20 overflow-hidden"
    >
      {/* Suptilni plavi sjaj u pozadini */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-[140px]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs tracking-wider uppercase">
            Upoznaj osnivača
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Iza POSLO ONE-a stoji{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              jasna vizija.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 md:gap-14 items-center rounded-[32px] border border-blue-500/15 bg-[#080d1c]/80 p-6 sm:p-10 shadow-xl backdrop-blur-xl">
          {/* PORTRET */}
          <div className="relative mx-auto w-full max-w-[320px] md:max-w-none">
            <div className="absolute -inset-3 rounded-[28px] bg-blue-600/10 blur-2xl pointer-events-none" />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border border-blue-500/25 bg-gradient-to-b from-[#0b1329] to-[#050914]">
              {photoFailed ? (
                <div
                  className="flex h-full w-full items-center justify-center text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-600"
                  role="img"
                  aria-label={FOUNDER_NAME}
                >
                  {FOUNDER_INITIALS}
                </div>
              ) : (
                <Image
                  src={FOUNDER_PHOTO}
                  alt={`${FOUNDER_NAME}, osnivač POSLO ONE platforme`}
                  fill
                  sizes="(min-width: 768px) 400px, 320px"
                  className="object-cover object-top"
                  onError={() => setPhotoFailed(true)}
                />
              )}
            </div>
          </div>

          {/* TEKST */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {FOUNDER_NAME}
            </h3>
            <p className="mt-1 mb-6 text-sm sm:text-base font-semibold text-blue-400">
              Osnivač i kreator POSLO ONE platforme
            </p>

            <div className="space-y-4 text-slate-300 leading-relaxed text-sm sm:text-base">
              <p>
                Zdravo, ja sam Harun, osnivač i kreator platforme POSLO ONE.
                Pokrenuo sam ovaj projekat s ciljem da biznisima olakšam
                poslovanje kroz praktična digitalna rješenja koja im pomažu da
                unaprijede svoje poslovanje i budu prisutniji na internetu.
              </p>
              <p>
                POSLO ONE razvijam s vizijom da na jednom mjestu objedini
                korisne alate za poslovanje, od web stranica i online
                rezervacija do digitalnog marketinga i automatizacije. Moj cilj
                je graditi platformu koja će se kontinuirano razvijati i
                prilagođavati stvarnim potrebama biznisa.
              </p>
            </div>

            <blockquote className="mt-8 border-l-2 border-blue-500/60 pl-5 text-lg sm:text-xl font-semibold text-white leading-snug">
              „Digitalna rješenja trebaju olakšati poslovanje, a ne ga
              komplikovati.”
            </blockquote>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Harun Ćatić na LinkedInu"
              className="mt-8 inline-flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-slate-200 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
