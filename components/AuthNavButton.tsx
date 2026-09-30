"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
);

interface AuthNavButtonProps {
  variant?: "desktop" | "mobile";
  onClick?: () => void;
}

export default function AuthNavButton({ variant = "desktop", onClick }: AuthNavButtonProps) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const label = loggedIn ? "Moj nalog" : "Prijava";

  if (variant === "mobile") {
    return (
      <Link
        href="/nalog"
        onClick={onClick}
        className="py-1 text-base font-semibold text-white hover:text-slate-200"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href="/nalog"
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-[14px] leading-none font-semibold text-white transition-all duration-300 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}