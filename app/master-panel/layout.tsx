"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "../dashboard/_components/icons";
import { DEFAULT_THEME, loadTheme, themeVars, type ThemeSettings } from "../dashboard/_lib/theme";
import { adminFetch, supabase } from "./_lib/admin";

type NavItem = { href: string; label: string; icon: IconName; exact?: boolean; soon?: boolean };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Platforma",
    items: [{ href: "/master-panel", label: "Biznisi", icon: "building", exact: true }],
  },
  {
    title: "Marketing",
    items: [
      { href: "/master-panel/marketing", label: "Pregled", icon: "chart", exact: true },
      { href: "/master-panel/marketing/kontakti", label: "Kontakti", icon: "users" },
      { href: "/master-panel/marketing/nizovi", label: "Automatski mejlovi", icon: "mail" },
      { href: "/master-panel/marketing/kampanje", label: "Kampanje", icon: "calendar", soon: true },
      { href: "/master-panel/marketing/analitika", label: "Analitika", icon: "trending", soon: true },
    ],
  },
];

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "login" | "forbidden" | "ok">("loading");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(loadTheme());
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return setState("login");
      try {
        const me = await adminFetch<{ email: string }>("/api/master/me");
        setEmail(me.email);
        setState("ok");
      } catch {
        setState("forbidden");
      }
    })();
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = SECTIONS.flatMap((s) => s.items).find(isActive)?.label || "Admin";

  if (state !== "ok") {
    return (
      <div style={themeVars(theme) as CSSProperties} className="flex min-h-dvh items-center justify-center bg-gray-950 px-4 text-center">
        {state === "loading" ? (
          <p className="text-sm text-gray-400">Učitavanje...</p>
        ) : (
          <div className="w-full max-w-sm space-y-4 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Icon name="shield" className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-white">POSLO ONE admin</h1>
            <p className="text-sm text-gray-400">
              {state === "login" ? "Prijavite se administratorskim nalogom." : "Ovaj nalog nema pristup admin panelu."}
            </p>
            {state === "login" && (
              <Link href="/prijava" className="block rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-400">
                Prijava
              </Link>
            )}
            <Link href="/" className="block text-xs text-gray-500 hover:text-white">Nazad na početnu</Link>
          </div>
        )}
      </div>
    );
  }

  const nav = (
    <nav aria-label="Admin navigacija">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="px-3 pb-2 text-xs font-medium text-gray-500">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(item);
              if (item.soon) {
                return (
                  <div key={item.href} className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] px-3 py-2.5 text-sm font-medium text-gray-600">
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                    {item.label}
                    <span className="ml-auto rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Uskoro</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 ${
                    active ? "bg-blue-500/10 text-blue-300" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-blue-400" />}
                  <Icon name={item.icon} className={`h-[18px] w-[18px] ${active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--po-radius)*0.8)] bg-gradient-to-br from-blue-400 to-blue-700 text-white shadow-lg shadow-blue-500/20">
        <Icon name="shield" className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <span className="block font-display text-sm font-bold text-white">POSLO ONE</span>
        <span className="block truncate text-xs font-medium text-blue-400">Admin · {email}</span>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-1 border-t border-white/[0.06] p-4">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
        <Icon name="dashboard" className="h-[18px] w-[18px]" />
        Moj panel firme
      </Link>
      <Link href="/" className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
        <Icon name="home" className="h-[18px] w-[18px]" />
        Nazad na početnu
      </Link>
    </div>
  );

  return (
    <div style={themeVars(theme) as CSSProperties} className="flex h-dvh w-full min-w-0 overflow-hidden bg-gray-950 text-gray-100">
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-gray-900/80 md:flex">
        <div>
          <div className="border-b border-white/[0.06] p-5">{brand}</div>
          <div className="p-4">{nav}</div>
        </div>
        {footer}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[min(19rem,calc(100vw-2rem))] flex-col justify-between overflow-y-auto border-r border-white/[0.06] bg-gray-900 shadow-2xl">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-5">
                {brand}
                <button onClick={() => setMenuOpen(false)} aria-label="Zatvori navigaciju" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">{nav}</div>
            </div>
            {footer}
          </aside>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96"
          style={{ background: "radial-gradient(60% 100% at 70% 0%, color-mix(in srgb, var(--color-blue-500) 14%, transparent), transparent)" }}
        />
        <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-gray-900/60 px-3 backdrop-blur-md sm:px-4 md:px-8">
          <button onClick={() => setMenuOpen(true)} aria-label="Otvori navigaciju" className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-300 hover:bg-white/5 md:hidden">
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <h1 className="truncate font-display text-base font-semibold text-white">{title}</h1>
          <span className="ml-auto hidden rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 sm:inline">Admin</span>
        </header>
        <main className="relative z-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 sm:px-4 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
