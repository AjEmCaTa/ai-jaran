"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Javna stranica za odjavu od POSLO ONE marketing mejlova.
export default function UnsubscribePage() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("t") || "");
  }, []);

  const unsubscribe = async () => {
    setState("busy");
    try {
      const res = await fetch("/api/marketing/odjava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Odjava nije uspjela.");
      setState("done");
    } catch (e) {
      setMessage((e as Error).message);
      setState("error");
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#030712] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-gray-900/70 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">POSLO ONE</p>
        {state === "done" ? (
          <>
            <h1 className="mt-4 font-display text-2xl font-bold text-white">Odjavljeni ste</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Više vam nećemo slati marketinške mejlove. Obavijesti o vašim rezervacijama i nalogu i dalje stižu normalno.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-2xl font-bold text-white">Odjava od mejlova</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Kliknite ispod i više vam nećemo slati novosti i savjete o POSLO ONE. Mejlovi o rezervacijama ostaju.
            </p>
            {!token && <p className="mt-4 text-sm text-amber-300">Link za odjavu nije potpun. Otvorite ga ponovo iz mejla.</p>}
            {state === "error" && <p className="mt-4 text-sm text-red-300">{message}</p>}
            <button
              onClick={unsubscribe}
              disabled={!token || state === "busy"}
              className="mt-6 w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {state === "busy" ? "Odjavljujem..." : "Odjavi me"}
            </button>
          </>
        )}
        <Link href="/" className="mt-6 block text-xs text-slate-500 hover:text-white">poslo.one</Link>
      </div>
    </main>
  );
}
