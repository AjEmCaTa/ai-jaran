'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useLang } from '../../components/site/LangProvider';
import { authErrorText } from '../../utils/authErrors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

const TEXT = {
  bs: {
    title: 'Zaboravljena lozinka',
    lead: 'Upišite e-mail s kojim ste se registrovali. Poslat ćemo vam link za novu lozinku.',
    email: 'E-mail',
    send: 'Pošalji link',
    wait: 'Šaljem...',
    sent: 'Ako taj e-mail ima nalog, link za novu lozinku je poslan. Provjerite i folder Spam.',
    failed: 'Link nije poslan. Pokušajte ponovo.',
    google: 'Ako ste se registrovali preko Googlea, lozinka vam ne treba: samo kliknite „Nastavi s Googleom” na stranici za prijavu.',
    back: 'Nazad na prijavu',
  },
  en: {
    title: 'Forgot password',
    lead: 'Enter the email you signed up with. We will send you a link to set a new password.',
    email: 'Email',
    send: 'Send link',
    wait: 'Sending...',
    sent: 'If that email has an account, a reset link has been sent. Check your Spam folder too.',
    failed: 'The link was not sent. Please try again.',
    google: 'If you signed up with Google, you do not need a password: just use “Continue with Google” on the login page.',
    back: 'Back to login',
  },
};

// Samo interne putanje (npr. /dashboard ili /nalog), nikad drugi sajt.
const safePath = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : null);

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const [back, setBack] = useState('/prijava');
  useEffect(() => {
    setBack(safePath(new URLSearchParams(window.location.search).get('nazad')) || '/prijava');
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const redirectTo = new URL('/nova-lozinka', window.location.origin);
    redirectTo.searchParams.set('dalje', back === '/nalog' ? '/nalog' : '/dashboard');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo.toString() });
    setBusy(false);
    if (err) setError(authErrorText(err, lang, t.failed));
    else setSent(true);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-12 text-white">
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#080d1c]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{t.title}</h1>
        <p className="mb-6 text-sm text-slate-400">{t.lead}</p>

        {sent ? (
          <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{t.sent}</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.email}
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
              {busy ? t.wait : t.send}
            </button>
          </form>
        )}

        <p className="mt-5 text-xs leading-relaxed text-slate-500">{t.google}</p>
        <Link href={back} className="mt-6 block text-center text-sm font-semibold text-blue-400 hover:text-blue-300">← {t.back}</Link>
      </div>
    </main>
  );
}
