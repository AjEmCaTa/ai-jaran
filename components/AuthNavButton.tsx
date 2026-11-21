"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useT } from "./site/LangProvider";

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

  const t = useT({ bs: { account: "Moj nalog", login: "Prijava" }, en: { account: "My account", login: "Log in" } });
  const label = loggedIn ? t.account : t.login;

  if (variant === "mobile") {
    return (
      <Link
        href="/nalog"
        onClick={onClick}
        className="flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-white hover:bg-white/10"
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