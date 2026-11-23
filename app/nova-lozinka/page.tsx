'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PasswordInput from '../../components/PasswordInput';
import { useLang } from '../../components/site/LangProvider';
import { authErrorText } from '../../utils/authErrors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

const TEXT = {
  bs: {
    title: 'Nova lozinka',
    lead: 'Upišite novu lozinku za svoj nalog.',
    password: 'Nova lozinka',
    confirm: 'Ponovite lozinku',
    save: 'Sačuvaj lozinku',
    wait: 'Spremam...',
    mismatch: 'Lozinke se ne podudaraju.',
    short: 'Lozinka mora imati najmanje 6 znakova.',
    failed: 'Lozinka nije promijenjena. Pokušajte ponovo.',
    checking: 'Provjeravam link...',
    invalid: 'Link je istekao ili je već iskorišten. Zatražite novi.',
    again: 'Zatraži novi link',
    done: 'Lozinka je promijenjena. Prebacujem vas dalje...',
  },
  en: {
    title: 'New password',
    lead: 'Enter a new password for your account.',
    password: 'New password',
    confirm: 'Repeat password',
    save: 'Save password',
    wait: 'Saving...',
    mismatch: 'The passwords do not match.',
    short: 'The password must have at least 6 characters.',
    failed: 'The password was not changed. Please try again.',
    checking: 'Checking the link...',
    invalid: 'The link has expired or was already used. Request a new one.',
    again: 'Request a new link',
    done: 'Your password has been changed. Redirecting...',
  },
};

const safePath = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/dashboard');

export default function NewPasswordPage() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const router = useRouter();
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Link iz e-maila prijavi korisnika privremeno (recovery); bez toga se lozinka ne može promijeniti.
  useEffect(() => {
    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        settled = true;
        setReady('ok');
      }
    });
    const timer = setTimeout(async () => {
      if (settled) return;
      const { data } = await supabase.auth.getSession();
      setReady(data.session ? 'ok' : 'invalid');
    }, 2500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError(t.short);
    if (password !== confirm) return setError(t.mismatch);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorText(err, lang, t.failed));
    setDone(true);
    const next = safePath(new URLSearchParams(window.location.search).get('dalje'));
    setTimeout(() => router.replace(next), 1200);
  };

  const input = 'mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-12 text-white">
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#080d1c]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{t.title}</h1>

        {ready === 'checking' && <p className="text-sm text-slate-400">{t.checking}</p>}

        {ready === 'invalid' && (
          <>
            <p role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{t.invalid}</p>
            <Link href="/zaboravljena-lozinka" className="mt-6 block rounded-xl bg-blue-600 py-3.5 text-center text-sm font-bold text-white hover:bg-blue-500">{t.again}</Link>
          </>
        )}

        {ready === 'ok' && (done ? (
          <p role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{t.done}</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm text-slate-400">{t.lead}</p>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.password}
              <div className="mt-2"><PasswordInput required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input.replace('mt-2 ', '')} /></div>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.confirm}
              <div className="mt-2"><PasswordInput required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input.replace('mt-2 ', '')} /></div>
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">{busy ? t.wait : t.save}</button>
          </form>
        ))}
      </div>
    </main>
  );
}
