"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Background from "../../../components/Background";

export default function CategoryPartnersPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [businessProfile, setBusinessProfile] = useState({
    name: "Dubinsko Ćatić",
    category: "Auto detailing & čišćenje",
    city: "Mostar",
    address: "Vrapčići",
    phone: "060 30 50 153",
    work_start: "07:00",
    work_end: "17:00",
    work_days: ["Pon", "Uto", "Sri", "Cet", "Pet", "Sub"],
  });

  // Provjeravamo da li je izabrana kategorija za dubinsko čišćenje
  const isDubinskoCategory =
    slug === "dubinsko-ciscenje" ||
    slug === "dubinsko-catic" ||
    slug === "dubinsko";

  useEffect(() => {
    if (!isDubinskoCategory) return;
    fetch("/api/business-profile?slug=dubinsko-catic")
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (!result?.business) return;
        const business = result.business;
        setBusinessProfile({
          name: business.name || "Dubinsko Ćatić",
          category: business.category || "",
          city: business.city || "",
          address: business.address || "",
          phone: business.phone || "",
          work_start: String(business.work_start || "").slice(0, 5),
          work_end: String(business.work_end || "").slice(0, 5),
          work_days: Array.isArray(business.work_days) ? business.work_days : [],
        });
      })
      .catch((error) => console.error("Profil biznisa nije učitan:", error));
  }, [isDubinskoCategory]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">
      <Background />

      <Navbar
        onOpenContact={() => {}}
        onResetHero={() => {}}
        onOpenCatalog={() => {}}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-32">
        <Link
          href="/katalog"
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-2.5 text-xs font-semibold text-gray-400 shadow-sm transition-colors hover:text-blue-400"
        >
          ← Nazad na sve kategorije kataloga
        </Link>

        {isDubinskoCategory ? (
          <div className="space-y-8">
            {/* Naslov kategorije */}
            <div>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
                Kategorija Partnera
              </span>

              <h1 className="mt-3 mb-2 text-3xl font-black tracking-tight text-white md:text-5xl">
                Dubinsko čišćenje & Detailing
              </h1>

              <p className="max-w-xl text-sm text-gray-400">
                Izaberite pouzdanog partnera za pranje i održavanje vašeg
                vozila ili namještaja.
              </p>
            </div>

            {/* LISTA BIZNISA (Kartice) */}
            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Kartica: Dubinsko Ćatić sa Okruglim Profilnim Logom */}
              <div className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0b0f19] p-6 shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-blue-500/80">
                <div>
                  {/* BADGEVI NA VRHU */}
                  <div className="mb-6 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Preporučeni Partner 🌟
                    </span>

                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                      🟢 Otvoreno
                    </span>
                  </div>

                  {/* ZAGLAVLJE KARTICE: OKRUGLI LOGO + NASLOV */}
                  <div className="mb-5 flex items-center gap-4">
                    {/* Okrugli okvir logotipa */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-blue-500/40 bg-white p-0.5 shadow-lg shadow-blue-500/10 transition-colors group-hover:border-blue-400">
                      <img
                        src="/partners/dubinsko-catic.jpg"
                        alt="Dubinsko Ćatić Logo"
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold leading-tight text-white transition-colors group-hover:text-blue-400">
                        {businessProfile.name}
                      </h3>

                      <span className="text-[11px] font-medium text-blue-400/90">
                        {businessProfile.category}
                      </span>
                    </div>
                  </div>

                  {/* OPIS BIZNISA */}
                  <p className="mb-6 text-xs leading-relaxed text-gray-400">
                    Profesionalno dubinsko pranje sjedišta, tepiha, krovnih
                    tapacirunga, te kompletno unutarnje i vanjsko pranje
                    vozila.
                  </p>

                  {/* INFORMACIJE O BIZNISU */}
                  <div className="mb-6 space-y-2 border-t border-white/5 pt-4 text-xs text-gray-300">
                    <p className="flex items-center gap-2">
                      <span className="text-blue-400">📍</span>
                      {[businessProfile.address, businessProfile.city].filter(Boolean).join(", ")}
                    </p>

                    <p className="flex items-center gap-2">
                      <span className="text-blue-400">📞</span>
                      {businessProfile.phone}
                    </p>

                    <p className="flex items-center gap-2 text-gray-400">
                      <span className="text-blue-400">🕒</span>
                      {businessProfile.work_days.join(" – ")}: {businessProfile.work_start} – {businessProfile.work_end}
                    </p>
                  </div>
                </div>

                {/* DUGME NA DNU KARTICE */}
                <Link
                  href="/katalog/dubinsko-catic"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-center text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
                >
                  Pogledaj ponudu i zakaži termin →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0b0f19] p-8 py-24 text-center shadow-2xl">
            <span className="mb-4 block text-5xl">🚀</span>

            <h2 className="mb-3 text-3xl font-extrabold text-white">
              Uskoro stižu partneri!
            </h2>

            <p className="mx-auto mb-6 max-w-md text-sm text-gray-400">
              Sveobuhvatna automatizacija i mreža partnera za ovu djelatnost
              su u fazi pripreme.
            </p>

            <Link
              href="/katalog"
              className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-500"
            >
              Vrati se nazad na katalog
            </Link>
          </div>
        )}
      </div>

      <Footer onOpenPrivacy={() => {}} />
    </main>
  );
}