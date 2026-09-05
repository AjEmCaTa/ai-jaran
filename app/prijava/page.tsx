'use client';

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Dinamičko skladištenje u zavisnosti od "Zapamti me" opcije
const getStorage = (remember: boolean) => {
  if (typeof window === "undefined") return undefined;
  return remember ? window.localStorage : window.sessionStorage;
};

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // Kreiramo Supabase klijent sa dinamičkim storage-om na osnovu "Zapamti me"
  const getSupabaseClient = (remember: boolean) => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: getStorage(remember),
        },
      }
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = getSupabaseClient(rememberMe);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const user = data.user;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('must_change_password')
          .eq('id', user.id)
          .single();

        if (profile && profile.must_change_password) {
          router.push('/promijeni-lozinku');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Neispravni podaci za prijavu. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white flex items-center justify-center px-4 py-12 selection:bg-blue-600 overflow-hidden">
      {/* Pozadinski svjetlosni efekat */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#080d1c]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        
        {/* Dugme za povratak */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-400 hover:text-white transition-colors duration-200 group"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span> 
            Nazad na početnu
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            Moj Panel
          </h1>
          <p className="text-slate-400 text-sm">
            Prijavite se sa podacima koje vam je dodijelio AI Jaran tim.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Korisničko ime ili Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Lozinka
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">
                Zapamti me
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? "Prijava u toku..." : "Prijavi se u panel"}
          </button>
        </form>

      </div>
    </main>
  );
}