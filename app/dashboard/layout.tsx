"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Icon, { type IconName } from "./_components/icons";
import { BusinessContext, normalizeBusiness, type DashboardBusiness } from "./_lib/business-context";
import PartnerLogo from "../../components/PartnerLogo";
import { PARTNER_LOGOS } from "../../utils/partnerLogos";
import NotificationBell from "./_components/NotificationBell";
import InstallButton from "../../components/InstallButton";
import { DEFAULT_THEME, THEME_EVENT, loadTheme, themeVars, type ThemeSettings } from "./_lib/theme";
import { useSwipeMenu } from "./_lib/useSwipeMenu";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token ?? null;

type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Danas", icon: "home", exact: true },
  { href: "/dashboard/reservations", label: "Termini", icon: "calendar" },
  { href: "/dashboard/inquiries", label: "Upiti", icon: "message" },
  { href: "/dashboard/customers", label: "Klijenti", icon: "users" },
];

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Osnovno",
    items: [
      { href: "/dashboard", label: "Kontrolna ploča", icon: "dashboard", exact: true },
      { href: "/dashboard/reservations", label: "Rezervacije i kalendar", icon: "calendar" },
      { href: "/dashboard/services", label: "Usluge i cijene", icon: "tag" },
      { href: "/dashboard/inquiries", label: "Upiti", icon: "bell" },
      { href: "/dashboard/customers", label: "Klijenti", icon: "users" },
    ],
  },
  {
    title: "Firma",
    items: [
      { href: "/dashboard/settings", label: "Podaci o firmi", icon: "building" },
      { href: "/dashboard/paket", label: "Paket i plaćanje", icon: "wallet" },
      { href: "/dashboard/qr-poster", label: "QR poster za print", icon: "qr" },
      { href: "/dashboard/preporuke", label: "Preporuči i zaradi", icon: "handshake" },
      { href: "/dashboard/izgled", label: "Izgled panela", icon: "palette" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [business, setBusiness] = useState<DashboardBusiness>(normalizeBusiness(null));
  const [ownerName, setOwnerName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessStatus, setAccessStatus] = useState("none");
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const drawerRef = useRef<HTMLElement>(null);
  const dragX = useSwipeMenu(mobileMenuOpen, setMobileMenuOpen, drawerRef);

  // Dok je meni otvoren, stranica ispod se ne pomjera.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileMenuOpen]);

  // Tema: učitaj pri otvaranju i slušaj promjene iz Postavki
  useEffect(() => {
    setTheme(loadTheme());
    const onChange = (event: Event) => setTheme((event as CustomEvent<ThemeSettings>).detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  const loadBusiness = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAccessStatus("unauthenticated");
        return;
      }
      // Jedan lagan zahtjev umjesto uzastopnih upita profiles -> businesses.
      const response = await fetch("/api/dashboard?scope=business", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setAccessStatus("unauthenticated");
      } else if (response.status === 403) {
        setAccessStatus(result.code === "pending" ? "pending" : "no-business");
      } else if (!response.ok) {
        throw new Error(result.error || "Podatke nije moguće učitati.");
      } else {
        const loaded = normalizeBusiness(result.business);
        setBusiness(loaded);
        setOwnerName(typeof result.ownerName === "string" ? result.ownerName.trim() : "");
        setAccessStatus("active");
      }
    } catch (err) {
      console.error("Greška pri učitavanju layout podataka:", err);
      setAccessStatus("error");
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  // Učitava se jednom po otvaranju dashboarda, ne pri svakoj promjeni stranice.
  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  useEffect(() => {
    if (accessStatus === "unauthenticated") {
      router.replace(`/prijava?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [accessStatus, pathname, router]);

  const fullName = ownerName && !ownerName.includes("@") ? ownerName : "Vlasnik";
  const businessName = business.name || "Moj Biznis";
  const businessCity = business.city;
  const initials = (() => {
    const source = ownerName && !ownerName.includes("@") ? ownerName : business.name;
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.trim().slice(0, 2).toUpperCase() || "PO";
  })();

  const ctx = useMemo(
    () => ({ business, ownerName, setOwnerName, refresh: loadBusiness }),
    [business, ownerName, loadBusiness],
  );

  if (accessStatus === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-sm text-slate-300">
        Podatke dashboarda trenutno nije moguće učitati. Osvježite stranicu.
      </div>
    );
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-sm text-gray-400">
        Učitavanje...
      </div>
    );
  }

  if (accessStatus === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-sm text-gray-400">
        Preusmjeravanje na prijavu...
      </div>
    );
  }

  if (accessStatus === "no-business") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-sm text-slate-300">
        Ovaj račun nije povezan s poslovnim dashboardom.
      </div>
    );
  }

  if (accessStatus !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-amber-500/20 bg-gray-900/60 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-2xl text-amber-400">
            !
          </div>
          <h1 className="text-xl font-bold text-white">Nalog čeka odobrenje</h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Tvoj dashboard još nije aktiviran. Kontaktiraj nas da završimo dogovor oko Pro paketa.
          </p>
          <a
            href="https://wa.me/387603050153"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-500"
          >
            Kontaktiraj nas na WhatsApp
          </a>
          <Link href="/" className="block text-xs text-slate-500 transition hover:text-white">
            Nazad na početnu
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : Boolean(pathname && pathname.startsWith(item.href));

  const currentTitle =
    SECTIONS.flatMap((section) => section.items).find(isActive)?.label || "Panel za upravljanje";

  const profileBlock = (
    <div className="flex items-center gap-3 overflow-hidden">
      {business.logo_url || PARTNER_LOGOS[business.slug] ? (
        <PartnerLogo slug={business.slug} name={business.name} src={business.logo_url} className="h-12 w-12" />
      ) : (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[calc(var(--po-radius)*0.9)] text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-blue-400), var(--color-blue-700))",
            boxShadow: "0 10px 28px -10px var(--color-blue-500)",
          }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <span className="block truncate font-display text-[15px] font-semibold text-white">{businessName}</span>
        <span className="block truncate text-xs text-gray-400">{fullName}{businessCity ? ` · ${businessCity}` : ""}</span>
        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
          {business.plan === "starter" ? "Starter" : "Pro"}
        </span>
      </div>
    </div>
  );

  const navContent = (
    <nav aria-label="Glavna navigacija">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[calc(var(--po-radius)*0.75)] px-2.5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-blue-400 ${
                    active
                      ? "border border-blue-500/25 text-white shadow-[0_8px_24px_-14px_var(--color-blue-500)]"
                      : "border border-transparent text-gray-400 hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  style={active ? { background: "linear-gradient(90deg, color-mix(in srgb, var(--color-blue-500) 22%, transparent), color-mix(in srgb, var(--color-blue-500) 4%, transparent))" } : undefined}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active ? "bg-blue-500 text-white shadow-[0_4px_14px_-4px_var(--color-blue-500)]" : "bg-white/[0.04] text-gray-400 group-hover:bg-white/[0.07] group-hover:text-gray-200"
                    }`}
                  >
                    <Icon name={item.icon} className="h-[17px] w-[17px]" />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_10px_var(--color-blue-400)]" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="space-y-2 border-t border-white/[0.06] p-4">
      <InstallButton mobileOnly={false} />
      <div className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.8)] border border-white/[0.06] bg-gray-950/50 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
          <Icon name="message" className="h-[17px] w-[17px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-gray-500">Podrška, svaki dan</p>
          <a href="tel:0603050153" className="text-sm font-semibold text-white hover:text-blue-300">060 30 50 153</a>
        </div>
      </div>
      <Link
        href="/"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Icon name="home" className="h-4 w-4" />
        Nazad na početnu stranicu
      </Link>
    </div>
  );

  return (
    <div
      style={themeVars(theme) as CSSProperties}
      className="flex h-dvh w-full min-w-0 overflow-hidden bg-gray-950 text-gray-100"
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="relative hidden w-72 shrink-0 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-gray-900/80 md:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--color-blue-500) 16%, transparent)" }}
        />
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-white/[0.06] p-5">{profileBlock}</div>
          <div className="p-3">{navContent}</div>
        </div>
        <div className="relative">{sidebarFooter}</div>
      </aside>

      {/* MOBILNI MENI: otvara se dugmetom ili povlačenjem prsta udesno, zatvara povlačenjem ulijevo */}
      <div className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen || dragX !== null ? "" : "pointer-events-none"}`} aria-hidden={!mobileMenuOpen}>
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          style={{
            opacity: dragX !== null ? dragX / (drawerRef.current?.offsetWidth || 300) : mobileMenuOpen ? 1 : 0,
            transition: dragX !== null ? "none" : "opacity 280ms ease",
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          ref={drawerRef}
          style={{
            ...(themeVars(theme) as CSSProperties),
            transform: dragX !== null ? `translateX(calc(${dragX}px - 100%))` : mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: dragX !== null ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className="absolute left-0 top-0 flex h-full w-[min(20rem,calc(100vw-3rem))] flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-gray-900 shadow-2xl"
          aria-label="Meni"
          inert={!mobileMenuOpen && dragX === null}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--color-blue-500) 18%, transparent)" }}
          />
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              {profileBlock}
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Zatvori navigaciju"
                className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3">{navContent}</div>
          </div>
          <div className="relative pb-[env(safe-area-inset-bottom)]">{sidebarFooter}</div>
        </aside>
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96"
          style={{
            background:
              "radial-gradient(60% 100% at 70% 0%, color-mix(in srgb, var(--color-blue-500) 14%, transparent), transparent)",
          }}
        />
        {/* Dva mutna "svjetla" u boji firme koja polako plutaju iza sadržaja */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="dash-orb absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--color-blue-500) 10%, transparent)" }}
          />
          <div
            className="dash-orb-2 absolute -left-32 bottom-0 h-[24rem] w-[24rem] rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--color-blue-700) 12%, transparent)" }}
          />
        </div>

        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-gray-900/60 px-3 backdrop-blur-md sm:px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Otvori navigaciju"
              aria-expanded={mobileMenuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-300 hover:bg-white/5 md:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <h1 className="truncate text-sm font-semibold text-gray-200">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell getToken={getToken} businessId={business.id} />
            <Link
              href="/dashboard/izgled"
              className="hidden items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-blue-500/40 hover:text-white sm:flex"
            >
              <Icon name="palette" className="h-4 w-4 text-blue-400" />
              Prilagodi izgled
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/15 text-xs font-bold text-blue-300">
              {initials}
            </div>
          </div>
        </header>

        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8">
          <BusinessContext.Provider value={ctx}>
            <div key={pathname} className="page-in">{children}</div>
          </BusinessContext.Provider>
        </main>

        {/* DONJI MENI (mobitel) */}
        <nav
          aria-label="Brza navigacija"
          className="relative z-10 grid shrink-0 grid-cols-5 border-t border-white/[0.07] bg-gray-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-blue-300" : "text-gray-500 hover:text-gray-200"
                }`}
              >
                <Icon name={item.icon} className="h-[22px] w-[22px]" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-200"
          >
            <Icon name="menu" className="h-[22px] w-[22px]" />
            Više
          </button>
        </nav>
      </div>
    </div>
  );
}