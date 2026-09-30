"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [fullName, setFullName] = useState("Korisnik");
  const [businessName, setBusinessName] = useState("Moj Biznis");
  const [businessCity, setBusinessCity] = useState("");
  const [initials, setInitials] = useState("PO");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessStatus, setAccessStatus] = useState("none");

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

        const profileResult = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

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
              setAccessStatus(
                business.status === "active" ? "active" : "pending"
              );
            }
          } else {
            setAccessStatus("no-business");
          }
        } else {
          setAccessStatus("no-business");
        }
      } catch (err) {
        console.error(
          "Greska pri ucitavanju layout podataka:",
          err
        );
      } finally {
        setCheckingAccess(false);
      }
    }

    loadLayoutData();
  }, [pathname, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
        Ucitavanje...
      </div>
    );
  }

  if (accessStatus === "unauthenticated") {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">Preusmjeravanje na prijavu...</div>;
  }

  if (accessStatus === "no-business") {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 text-center text-sm text-slate-300">Ovaj račun nije povezan s poslovnim dashboardom.</div>;
  }

  if (accessStatus !== "active") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl border border-amber-500/20 bg-gray-900/60">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
            !
          </div>

          <h1 className="text-xl font-bold text-white">
            Nalog ceka odobrenje
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Tvoj dashboard jos nije aktiviran. Kontaktiraj nas da zavrsimo
            dogovor oko Pro paketa.
          </p>

          <a
            href="https://wa.me/387603050153"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm"
          >
            Kontaktiraj nas na WhatsApp
          </a>

          <Link
            href="/"
            className="block text-xs text-slate-500 hover:text-white transition"
          >
            Nazad na pocetnu
          </Link>
        </div>
      </div>
    );
  }

  const navLinksContent = (
    <div>
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 text-gray-300 mb-2"
      >
        <span>Nazad na pocetnu</span>
      </Link>

      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-3">
        Osnovno
      </p>

      <Link
        href="/dashboard"
        className={
          pathname === "/dashboard"
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-950 text-blue-400 border border-blue-800/50"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 text-gray-300"
        }
      >
        <span>Kontrolna ploca</span>
      </Link>

      <Link
        href="/dashboard/reservations"
        className={
          pathname && pathname.indexOf("/reservations") !== -1
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-950 text-blue-400 border border-blue-800/50"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 text-gray-300"
        }
      >
        <span>Rezervacije i kalendar</span>
      </Link>

      <Link
        href="/dashboard/services"
        className={
          pathname && pathname.indexOf("/services") !== -1
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-950 text-blue-400 border border-blue-800/50"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 text-gray-300"
        }
      >
        <span>Usluge i cijene</span>
      </Link>

      <Link
        href="/dashboard/customers"
        className={
          pathname === "/dashboard/customers"
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-950 text-blue-400 border border-blue-800/50"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 text-gray-300"
        }
      >
        <span>Klijenti</span>
      </Link>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex-col justify-between hidden md:flex">
        <div>
          <div className="p-5 border-b border-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-600/30 shrink-0">
              {initials}
            </div>

            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">
                {fullName}
              </span>

              <span className="text-[11px] text-blue-400 font-medium block truncate">
                {businessName}
              </span>

              <span className="text-[10px] text-gray-400 block truncate">
                {businessCity}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-1">
            {navLinksContent}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="px-3 py-2 rounded-lg bg-gray-950/50 border border-gray-800/60">
            <p className="text-[11px] text-gray-400">
              POSLO ONE Podrska:
            </p>

            <p className="text-xs font-semibold text-blue-400">
              060 30 50 153
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-72 bg-gray-900 border-r border-gray-800 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="p-5 border-b border-gray-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-600/30 shrink-0">
                    {initials}
                  </div>

                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-white block truncate">
                      {fullName}
                    </span>

                    <span className="text-[11px] text-blue-400 font-medium block truncate">
                      {businessName}
                    </span>

                    <span className="text-[10px] text-gray-400 block truncate">
                      {businessCity}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white text-lg font-bold shrink-0 px-2"
                >
                  X
                </button>
              </div>

              <div className="p-4 space-y-1">
                {navLinksContent}
              </div>
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="px-3 py-2 rounded-lg bg-gray-950/50 border border-gray-800/60">
                <p className="text-[11px] text-gray-400">
                  POSLO ONE Podrska:
                </p>

                <p className="text-xs font-semibold text-blue-400">
                  060 30 50 153
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-300 text-lg"
            >
              Menu
            </button>

            <h1 className="text-sm font-bold text-gray-300">
              Panel za upravljanje
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">
              PO
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}