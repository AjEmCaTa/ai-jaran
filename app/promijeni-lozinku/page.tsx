'use client';

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export default function PromijeniLozinkuPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Lozinke se ne podudaraju.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    setLoading(true);

    try {
      // 1. Dobijamo trenutnog prijavljenog korisnika
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Korisnik nije prijavljen.");

      // 2. Ažuriramo lozinku u Supabase Auth-u
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      if (updateError) throw updateError;

      // 3. Postavljamo must_change_password na FALSE u profiles tabeli
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Preusmjeravamo na dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Došlo je do greške pri promjeni lozinke.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white flex items-center justify-center px-4 py-12 selection:bg-blue-600 overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#080d1c]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            Promjena lozinke
          </h1>
          <p className="text-slate-400 text-sm">
            Pošto se prijavljujete prvi put, morate postaviti novu, sigurnu lozinku koju ćete koristiti ubuduće.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Nova lozinka
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Potvrdite novu lozinku
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? "Spuštanje nove lozinke..." : "Sačuvaj novu lozinku"}
          </button>
        </form>
      </div>
    </main>
  );
}