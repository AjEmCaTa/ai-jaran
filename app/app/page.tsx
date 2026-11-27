'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useT } from '../../components/site/LangProvider';

// Početni ekran aplikacije (start_url iz manifest.json).
// Prijavljen vlasnik firme ide u panel, prijavljen klijent na početnu, a neprijavljen vidi dobrodošlicu.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

const TEXT = {
  bs: {
    tagline: 'Zakaži termin bez poziva i poruka.',
    login: 'Prijavi se ili napravi račun',
    owner: 'Imaš firmu?',
    register: 'Registruj firmu',
  },
  en: {
    tagline: 'Book appointments without calls or messages.',
    login: 'Sign in or create an account',
    owner: 'Own a business?',
    register: 'Register your business',
  },
};

export default function AppStart() {
  const router = useRouter();
  const t = useT(TEXT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('poslo_app', '1');
      document.documentElement.classList.add('app-mode', 'app-ui');
    } catch {}

    let cancelled = false;
    const started = Date.now();
    const go = (path: string) => {
      const wait = Math.max(0, 700 - (Date.now() - started));
      setTimeout(() => !cancelled && router.replace(path), wait);
    };

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setTimeout(() => !cancelled && setReady(true), Math.max(0, 700 - (Date.now() - started)));
          return;
        }
        const { data: profile } = await supabase.from('profiles').select('business_id').eq('id', session.user.id).maybeSingle();
        go(profile?.business_id ? '/dashboard' : '/');
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#030712] px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] text-white">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-[8%] h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-[40%] h-[420px] w-[420px] rounded-full bg-purple-600/15 blur-[120px]" />

      <div className={`relative z-10 flex flex-1 flex-col items-center justify-center transition-transform duration-700 ease-out ${ready ? '-translate-y-6' : ''}`}>
        <Image src="/poslo.one.png" alt="POSLO ONE" width={112} height={112} priority className="app-logo-in h-28 w-28 drop-shadow-[0_18px_50px_rgba(37,99,235,0.45)]" />
        <h1 className="app-rise mt-6 text-[34px] font-black tracking-tight" style={{ animationDelay: '0.15s' }}>POSLO ONE</h1>
        <p className="app-rise mt-2 text-center text-[15px] text-slate-400" style={{ animationDelay: '0.25s' }}>{t.tagline}</p>
        {!ready && (
          <div className="mt-10 h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 app-loader rounded-full bg-blue-500" />
          </div>
        )}
      </div>

      {ready && (
        <div className="relative z-10 mx-auto w-full max-w-sm space-y-3">
          <Link href="/nalog?next=/app" className="app-press app-rise flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 text-[16px] font-bold shadow-lg shadow-blue-600/30">
            {t.login}
          </Link>
          <p className="app-rise pt-3 text-center text-[13px] text-slate-400" style={{ animationDelay: '0.16s' }}>
            {t.owner}{' '}
            <Link href="/registracija" className="font-semibold text-blue-300">{t.register}</Link>
          </p>
        </div>
      )}
    </main>
  );
}
