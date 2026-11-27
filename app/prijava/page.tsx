'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '../../components/PasswordInput';
import { useLang, useT } from '../../components/site/LangProvider';
import { authErrorText } from '../../utils/authErrors';

const TEXT = {
  bs: {
    noConfig: 'Supabase postavke nisu pronađene. Provjeri .env.local fajl.', failed: 'Prijava nije uspjela. Pokušaj ponovo.', invalid: 'Neispravni podaci za prijavu. Pokušaj ponovo.',
    back: 'Nazad na početnu', title: 'Moj Panel', sub: 'Prijavite se e-mailom i lozinkom ili Google računom s kojim ste registrovali firmu.', password: 'Lozinka',
    loading: 'Prijava u toku...', submit: 'Prijavi se u panel', emailPh: 'vas@email.com', or: 'ili', google: 'Nastavi s Googleom',
  },
  en: {
    noConfig: 'Supabase settings not found. Check the .env.local file.', failed: 'Login failed. Please try again.', invalid: 'Invalid login details. Please try again.',
    back: 'Back to home', title: 'My Panel', sub: 'Log in with the email and password or the Google account you registered your business with.', password: 'Password',
    loading: 'Logging in...', submit: 'Log in to the panel', emailPh: 'you@email.com', or: 'or', google: 'Continue with Google',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const t = useT(TEXT);
  const { lang } = useLang();

  // Vlasnici registrovani preko Googlea: ista Google prijava kao na /nalog, pa nazad u panel (ili na traženu stranicu).
  const continueWithGoogle = async () => {
    setLoading(true);
    setErrorMsg('');
    const requested = new URLSearchParams(window.location.search).get('next');
    const next = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
    const redirectTo = new URL('/nalog', window.location.origin);
    redirectTo.searchParams.set('next', next);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo.toString() } });
    if (error) {
      setErrorMsg(authErrorText(error, lang, t.failed));
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setErrorMsg('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMsg(t.noConfig);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error(t.failed);
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          'Greška prilikom učitavanja profila:',
          profileError.message
        );
      }

      if (profile?.must_change_password) {
        router.push('/promijeni-lozinku');
        router.refresh();
        return;
      }

      const isAdmin =
        user.email?.toLowerCase() === 'caticharun126@gmail.com';
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const safeRequestedPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : null;

      if (safeRequestedPath) {
        router.push(safeRequestedPath);
      } else if (isAdmin) {
        router.push('/master-panel');
      } else {
        router.push('/dashboard');
      }

      router.refresh();
    } catch (error: unknown) {
      setErrorMsg(authErrorText(error, lang, t.invalid));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] px-4 py-12 text-white flex items-center justify-center selection:bg-blue-600">
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#080d1c]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors duration-200 hover:text-white"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>
            {t.back}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t.title}
          </h1>

          <p className="text-sm text-slate-400">
            {t.sub}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPh}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base sm:text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              {t.password}
            </label>

            <PasswordInput
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Link href="/zaboravljena-lozinka?nazad=/prijava" className="mt-2 inline-block text-xs font-medium text-blue-400 hover:text-blue-300">
              {lang === 'en' ? 'Forgot password?' : 'Zaboravili ste lozinku?'}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-white/10" />{t.or}<span className="h-px flex-1 bg-white/10" /></div>
        <button type="button" onClick={continueWithGoogle} disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50">
          {t.google}
        </button>
      </div>
    </main>
  );
}
