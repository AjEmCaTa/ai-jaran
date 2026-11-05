"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Background from "../../../components/Background";
import PartnerLogo from "../../../components/PartnerLogo";
import Icon from "../../../components/Icon";
import BusinessBookingPage from "../../../components/BusinessBookingPage";
import { CATALOG_CATEGORIES, categoryBySlug, categoryOf } from "../../../utils/catalog";

type CatalogBusiness = { slug: string; name: string; city: string; category: string; logo_url: string };

// Stari linkovi kategorija koji i dalje rade.
const CATEGORY_ALIASES: Record<string, string> = { dubinsko: "dubinsko-ciscenje", "sun-solution": "solarni-sistemi" };

function CategoryPartnersPage({ categorySlug }: { categorySlug: string }) {
  const category = categoryBySlug(categorySlug);
  const [businesses, setBusinesses] = useState<CatalogBusiness[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [city, setCity] = useState("");

  useEffect(() => {
    setCity(new URLSearchParams(window.location.search).get("grad") || "");
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((json) => setBusinesses(Array.isArray(json.businesses) ? json.businesses : []))
      .catch(() => setBusinesses([]))
      .finally(() => setLoaded(true));
  }, []);

  const list = useMemo(
    () => businesses.filter((b) => categoryOf(b.category) === categorySlug && (!city || b.city.trim() === city)),
    [businesses, categorySlug, city]
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">
      <Background />
      <Navbar onOpenContact={() => (window.location.href = "/cjenovnik")} onResetHero={() => {}} onOpenCatalog={() => {}} />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-32">
        <Link
          href="/katalog"
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-2.5 text-xs font-semibold text-gray-400 shadow-sm transition-colors hover:text-blue-400"
        >
          ← Nazad na sve kategorije kataloga
        </Link>

        {category ? (
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
                <Icon name={category.icon} className="h-3.5 w-3.5" />
                Kategorija
              </span>
              <h1 className="mb-2 mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">{category.title}</h1>
              <p className="max-w-xl text-sm text-gray-400">{category.description}</p>
              {city && (
                <p className="mt-3 text-xs text-slate-400">
                  Grad: <span className="font-semibold text-white">{city}</span>{" "}
                  <button type="button" onClick={() => setCity("")} className="ml-2 text-blue-400 hover:text-blue-300">
                    Prikaži sve gradove
                  </button>
                </p>
              )}
            </div>

            {!loaded ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-3xl border border-white/10 bg-[#0b0f19]" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <EmptyCategory />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/katalog/${b.slug}`}
                    className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0b0f19] p-6 shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-blue-500/80"
                  >
                    <div>
                      <div className="mb-5 flex items-center justify-between gap-2">
                        <span className="rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          Partner
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
                          Online zakazivanje
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <PartnerLogo slug={b.slug} name={b.name} src={b.logo_url} className="h-16 w-16" />
                        <div className="min-w-0">
                          <h3 className="text-xl font-extrabold leading-tight text-white transition-colors group-hover:text-blue-400">{b.name}</h3>
                          {b.city && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                              <Icon name="mapPin" className="h-3.5 w-3.5 text-blue-400" />
                              {b.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="mt-6 block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-bold text-white transition group-hover:bg-blue-500">
                      Pogledaj usluge i zakaži termin
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyCategory />
        )}
      </div>

      <Footer />
    </main>
  );
}

function EmptyCategory() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0b0f19] p-8 py-20 text-center shadow-2xl">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 text-blue-300">
        <Icon name="sparkles" className="h-7 w-7" />
      </span>
      <h2 className="mb-3 text-3xl font-extrabold text-white">Uskoro stižu partneri!</h2>
      <p className="mx-auto mb-8 max-w-md text-sm text-gray-400">
        U ovoj kategoriji još nema firmi. Imate firmu ovdje? Klijenti bi vas mogli zakazivati online već danas.
      </p>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/registracija" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
          Dodaj svoju firmu
        </Link>
        <Link href="/katalog" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
          Vrati se na katalog
        </Link>
      </div>
    </div>
  );
}

const CATEGORY_SLUGS = new Set([...CATALOG_CATEGORIES.map((c) => c.slug), ...Object.keys(CATEGORY_ALIASES)]);

export default function KatalogSlugPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const isCategory = CATEGORY_SLUGS.has(slug);
  const [mode, setMode] = useState<"checking" | "business" | "category">(isCategory ? "category" : "checking");

  useEffect(() => {
    if (isCategory) return;
    let cancelled = false;
    fetch(`/api/business-profile?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((response) => {
        if (!cancelled) setMode(response.ok ? "business" : "category");
      })
      .catch(() => {
        if (!cancelled) setMode("category");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isCategory]);

  if (mode === "business") return <BusinessBookingPage slug={slug} />;
  if (mode === "category") return <CategoryPartnersPage categorySlug={CATEGORY_ALIASES[slug] || slug} />;
  return (
    <main className="relative min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-24 pt-32">
        <div className="h-56 animate-pulse rounded-3xl border border-white/10 bg-[#0b0f19]" />
        <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-[#0b0f19]" />
      </div>
    </main>
  );
}
