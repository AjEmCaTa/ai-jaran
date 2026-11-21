"use client";

import Icon, { type IconName } from "./Icon";
import { useT } from "./site/LangProvider";
interface FeatureItem {
  title: string;
  desc: string;
}

const icons: IconName[] = ["link", "calendar", "bell", "clock"];

const ITEMS_EN: FeatureItem[] = [
  {
    title: "You get your own booking page",
    desc: "We add your services, prices and working hours. You get a link and a QR code to put on Instagram, WhatsApp, Google or your shop door.",
  },
  {
    title: "The client picks a time",
    desc: "They see services, prices and free slots and book in seconds, at any time of day. Taken slots can't be double booked.",
  },
  {
    title: "You get notified right away",
    desc: "A new request arrives by email and on your phone. Confirm it or suggest another time with one tap, and the client gets an email automatically.",
  },
  {
    title: "Reminders and fair cancellation",
    desc: "The client gets a reminder 24 hours before. They can cancel up to 2 hours ahead, so the slot opens up for someone else.",
  },
];

const ITEMS_BS: FeatureItem[] = [
  {
    title: "Dobiješ svoju stranicu za zakazivanje",
    desc: "Unesemo tvoje usluge, cijene i radno vrijeme. Dobiješ link i QR kod koji staviš na Instagram, WhatsApp, Google ili vrata radnje.",
  },
  {
    title: "Klijent sam izabere termin",
    desc: "Vidi usluge, cijene i slobodne termine i zakaže za par sekundi, u bilo koje doba. Zauzeti termini se ne mogu duplo zakazati.",
  },
  {
    title: "Ti odmah dobiješ obavijest",
    desc: "Novi zahtjev stiže na email i telefon. Potvrdiš ili predložiš drugi termin jednim klikom, a klijent automatski dobije mail.",
  },
  {
    title: "Podsjetnik i pošteno otkazivanje",
    desc: "Klijent dobije podsjetnik 24 sata prije termina. Može otkazati najkasnije 2 sata ranije, pa se termin oslobađa za nekog drugog.",
  },
];

const TEXT = {
  bs: { items: ITEMS_BS, how: "Kako", works: "radi?", sub: "Četiri koraka, a prvi za tebe uradimo mi." },
  en: { items: ITEMS_EN, how: "How does it", works: "work?", sub: "Four steps, and we do the first one for you." },
};

export default function Features() {
  const t = useT(TEXT);
  return (
    <section id="demo" className="scroll-mt-24 py-12 px-5 sm:py-28 sm:px-8 bg-[#030712] relative z-20 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-[140px]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t.how}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              {t.works}
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg">{t.sub}</p>
        </div>

        <div className="space-y-3 sm:space-y-6">
          {t.items.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-[24px] border border-blue-500/15 bg-[#080d1c]/80 p-4 sm:p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0b1329] hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] flex flex-row items-start sm:items-center gap-4 sm:gap-6"
            >
              <div className="w-11 h-11 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-300 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Icon name={icons[index]} className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <span className="hidden sm:inline px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs tracking-wider">
                    {`0${index + 1}`}
                  </span>
                  <h3 className="text-[17px] leading-snug sm:text-2xl font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-slate-300 leading-relaxed text-[13.5px] sm:text-base">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
