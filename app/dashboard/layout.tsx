"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Icon, { type IconName } from "./_components/icons";
import NotificationBell from "./_components/NotificationBell";
import { DEFAULT_THEME, THEME_EVENT, loadTheme, themeVars, type ThemeSettings } from "./_lib/theme";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token ?? null;

type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Osnovno",
    items: [
      { href: "/dashboard", label: "Kontrolna ploča", icon: "dashboard", exact: true },
      { href: "/dashboard/reservations", label: "Rezervacije i kalendar", icon: "calendar" },
      { href: "/dashboard/services", label: "Usluge i cijene", icon: "tag" },
      { href: "/dashboard/customers", label: "Klijenti", icon: "users" },
    ],
  },
  {
    title: "Prilagodba",
    items: [{ href: "/dashboard/settings", label: "Postavke i izgled", icon: "settings" }],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [fullName, setFullName] = useState("Korisnik");
  const [businessName, setBusinessName] = useState("Moj Biznis");
  const [businessCity, setBusinessCity] = useState("");
  const [initials, setInitials] = useState("PO");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessStatus, setAccessStatus] = useState("none");
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);

  // Tema: učitaj pri otvaranju i slušaj promjene iz Postavki
  useEffect(() => {
    setTheme(loadTheme());
    const onChange = (event: Event) => setTheme((event as CustomEvent<ThemeSettings>).detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  useEffect(() => {
    async function loadLayoutData() {
      try {
        const userResult = await supabase.auth.getUser();
        const user = userResult.data.user;

        if (!user) {
          setAccessStatus("unauthenticated");
          router.replace(`/prijava?next=${encodeURIComponent(pathname || "/dashboard")}`);
          return;
        }

        const profileResult = await supabase.from("profiles").select("*").eq("id", user.id).single();
        const profile = profileResult.data;

        if (profile) {
          const name = profile.name || profile.full_name || "Korisnik";
          setFullName(name);

          const parts = name.split(" ");
          if (parts.length >= 2) {
            setInitials((parts[0][0] + parts[1][0]).toUpperCase());
          } else if (name.length > 0) {
            setInitials(name.substring(0, 2).toUpperCase());
          }

          if (profile.business_id) {
            const businessResult = await supabase
              .from("businesses")
              .select("name, city, status")
              .eq("id", profile.business_id)
              .single();
            const business = businessResult.data;

            if (business) {
              setBusinessName(business.name || "Moj Biznis");
              setBusinessCity(business.city || "");
              setAccessStatus(business.status === "active" ? "active" : "pending");
            }
          } else {
            setAccessStatus("no-business");
          }
        } else {
          setAccessStatus("no-business");
        }
      } catch (err) {
        console.error("Greška pri učitavanju layout podataka:", err);
      } finally {
        setCheckingAccess(false);
      }
    }

    loadLayoutData();
  }, [pathname, router]);

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
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--po-radius)*0.8)] text-sm font-bold text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, var(--color-blue-400), var(--color-blue-700))",
          boxShadow: "0 8px 24px -8px var(--color-blue-500)",
        }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">{fullName}</span>
        <span className="block truncate text-xs font-medium text-blue-400">{businessName}</span>
        {businessCity && <span className="block truncate text-[11px] text-gray-500">{businessCity}</span>}
      </div>
    </div>
  );

  const navContent = (
    <nav aria-label="Glavna navigacija">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="px-3 pb-2 text-xs font-medium text-gray-500">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 ${
                    active ? "bg-blue-500/10 text-blue-300" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-blue-400" />}
                  <Icon
                    name={item.icon}
                    className={`h-[18px] w-[18px] ${active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="space-y-3 border-t border-white/[0.06] p-4">
      <Link
        href="/"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Icon name="home" className="h-[18px] w-[18px]" />
        Nazad na početnu
      </Link>
      <div className="rounded-[calc(var(--po-radius)*0.8)] border border-white/[0.06] bg-gray-950/60 px-3 py-2.5">
        <p className="text-[11px] text-gray-500">POSLO ONE podrška</p>
        <a href="tel:0603050153" className="text-sm font-semibold text-blue-400">
          060 30 50 153
        </a>
      </div>
    </div>
  );

  return (
    <div
      style={themeVars(theme) as CSSProperties}
      className="flex h-dvh w-full min-w-0 overflow-hidden bg-gray-950 text-gray-100"
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-gray-900/80 md:flex">
        <div>
          <div className="border-b border-white/[0.06] p-5">{profileBlock}</div>
          <div className="p-4">{navContent}</div>
        </div>
        {sidebarFooter}
      </aside>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside
            style={themeVars(theme) as CSSProperties}
            className="absolute left-0 top-0 flex h-full w-[min(19rem,calc(100vw-2rem))] flex-col justify-between overflow-y-auto border-r border-white/[0.06] bg-gray-900 shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-5">
                {profileBlock}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Zatvori navigaciju"
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">{navContent}</div>
            </div>
            {sidebarFooter}
          </aside>
        </div>
      )}

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
            <NotificationBell getToken={getToken} />
            <Link
              href="/dashboard/settings"
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

        <main className="relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}