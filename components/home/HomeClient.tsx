"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../Footer";
import Icon, { type IconName } from "../Icon";
import CatalogBrowser from "../catalog/CatalogBrowser";
import OwnerCard from "../app/OwnerCard";
import { useT } from "../site/LangProvider";
import { GENERAL_SUBJECT, useSite } from "../site/siteContext";
import type { CatalogBusiness } from "../../utils/catalogData";

const TEXT = {
  bs: {
    kicker: "Online zakazivanje · BiH",
    title1: "Zakaži termin",
    title2: "bez poziva i poruka",
    lead: "Pronađi firmu, izaberi uslugu i slobodan termin. Dobiješ potvrdu odmah i podsjetnik dan prije.",
    howTitle: "Kako radi",
    video: "Kako klijent zakaže termin preko POSLO ONE",
    steps: [
      { icon: "search", title: "Pronađi firmu", text: "Frizer, salon, auto, apartman: sve na jednom mjestu." },
      { icon: "calendar", title: "Izaberi termin", text: "Vidiš slobodne termine i cijene, i zakažeš za par sekundi." },
      { icon: "bell", title: "Dobiješ podsjetnik", text: "Termin je odmah upisan, a dan prije stiže podsjetnik." },
    ],
    ownerKicker: "Za vlasnike firmi",
    ownerTitle: "Imaš firmu? Neka ti klijenti zakazuju sami.",
    ownerText: "Svoja stranica, obavijest za svaki termin i podsjetnici klijentima. Postaviš za par minuta, a prvih 30 dana je besplatno.",
    ownerCta: "Saznaj više za firme",
    ownerPricing: "Cjenovnik",
  },
  en: {
    kicker: "Online booking · Bosnia and Herzegovina",
    title1: "Book an appointment",
    title2: "without calls or messages",
    lead: "Find a business, pick a service and a free slot. You get a confirmation right away and a reminder the day before.",
    howTitle: "How it works",
    video: "How a client books through POSLO ONE",
    steps: [
      { icon: "search", title: "Find a business", text: "Hairdresser, salon, car care, apartment: all in one place." },
      { icon: "calendar", title: "Pick a time", text: "See free slots and prices, and book in seconds." },
      { icon: "bell", title: "Get a reminder", text: "Your booking is saved right away, with a reminder the day before." },
    ],
    ownerKicker: "For business owners",
    ownerTitle: "Own a business? Let clients book on their own.",
    ownerText: "Your own page, a notification for every booking and reminders for clients. Set up in minutes, first 30 days free.",
    ownerCta: "Learn more for businesses",
    ownerPricing: "Pricing",
  },
};

export default function HomeClient({ businesses, retry }: { businesses: CatalogBusiness[]; retry: boolean }) {
  const t = useT(TEXT);
  const { openContact } = useSite();
  const [, setHeroKey] = useState(0);

  // Klik na logo na početnoj vrati na vrh (Navbar šalje ovaj događaj).
  useEffect(() => {
    const reset = () => setHeroKey((k) => k + 1);
    window.addEventListener("poslo:reset-hero", reset);
    return () => window.removeEventListener("poslo:reset-hero", reset);
  }, []);

  // Otvori kontakt kada se dođe sa /cjenovnik, npr. /?contact=true&plan=starter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("contact") !== "true") return;
    const plan = params.get("plan");
    openContact(plan === "starter" ? "Starter" : plan === "pro" ? "POSLO ONE Pro (50 KM)" : GENERAL_SUBJECT);
    window.history.replaceState({}, "", "/");
  }, [openContact]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:pt-36">
        {/* Vlasnik firme u aplikaciji: brz pregled i ulaz u panel */}
        <OwnerCard />

        {/* Vrh: odmah jasno da se ovdje zakazuje */}
        <div className="mx-auto mb-8 max-w-3xl space-y-4 text-center">
          <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
            {t.kicker}
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
            {t.title1}
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{t.title2}</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">{t.lead}</p>
        </div>

        {/* Djelatnosti, pa video i kako radi, pa firme: isti podaci i linkovi kao ranije */}
        <CatalogBrowser
          businesses={businesses}
          retry={retry}
          homeLayout
          middle={
            <section className="store-hidden mt-20 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">{t.howTitle}</h2>
                <div className="space-y-4">
                  {t.steps.map((s, i) => (
                    <div key={s.title} className="flex gap-4 rounded-3xl border border-slate-800/80 bg-gray-900/40 p-5 backdrop-blur-md">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                        <Icon name={s.icon as IconName} className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          <span className="mr-2 text-xs font-bold text-slate-500">0{i + 1}</span>
                          {s.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 flex justify-center lg:order-2">
                <div className="relative w-full max-w-[300px] sm:max-w-[340px]">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.14] blur-[100px]" />
                  <div className="relative overflow-hidden rounded-[30px] border border-blue-400/25 bg-[#020617] p-1.5 shadow-[0_0_80px_rgba(37,99,235,0.18)]">
                    <video
                      className="block aspect-[780/1220] w-full rounded-[24px] object-cover"
                      src="/video/poslo-one-demo-v3.mp4"
                      poster="/video/poslo-one-demo-v3-poster.jpg"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-label={t.video}
                    />
                  </div>
                </div>
              </div>
            </section>
          }
        />

        {/* Za vlasnike firmi */}
        <section className="store-hidden relative mt-16 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/15 via-gray-900/60 to-violet-600/15 p-8 text-center shadow-2xl backdrop-blur-md md:p-12">
          <div className="relative z-10 mx-auto max-w-2xl space-y-4">
            <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
              {t.ownerKicker}
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">{t.ownerTitle}</h2>
            <p className="text-sm leading-relaxed text-slate-400 md:text-base">{t.ownerText}</p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Link href="/za-firme" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500">
                {t.ownerCta} →
              </Link>
              <Link href="/cjenovnik" className="inline-flex items-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
                {t.ownerPricing}
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
