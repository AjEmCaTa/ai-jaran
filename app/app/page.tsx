'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useT } from '../../components/site/LangProvider';

// Početni ekran aplikacije (start_url). Nastavlja se na Android splash: isti logo, ista veličina, ista pozadina.
// Prijavljen korisnik ide na Početnu; neprijavljen prvi put vidi uvod (3 slajda), a poslije uvijek samo prijavu.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

const INTRO_KEY = 'poslo_intro_v1';

const TEXT = {
  bs: {
    skip: 'Preskoči',
    next: 'Dalje',
    start: 'Počni',
    slides: [
      { t1: 'Pronađi firmu', t2: 'u svom gradu', s: 'Frizeri, praonice, apartmani, gradnja i još mnogo toga, sve na jednom mjestu.' },
      { t1: 'Izaberi slobodan', t2: 'termin', s: 'Vidiš samo slobodna vremena, bez poziva i dopisivanja.' },
      { t1: 'Potvrda odmah,', t2: 'podsjetnik dan prije', s: 'Ne moraš ništa pamtiti, javljamo ti na vrijeme.' },
    ],
    cats: ['Frizeri', 'Praonice', 'Apartmani', 'Zdravlje', 'Solari', 'Gradnja'],
    search: 'Frizer u Mostaru…',
    confirmed: 'Termin je potvrđen',
    confirmedSub: 'Sutra u 10:30 · dobit ćeš podsjetnik',
    reminder: 'Podsjetnik',
    reminderSub: 'Tvoj termin je sutra u 10:30',
    welcome: 'Dobro došao',
    welcomeSub: 'Prijavi se da zakažeš prvi termin.',
    google: 'Nastavi s Googleom',
    email: 'Prijavi se e-mailom',
    owner: 'Imaš firmu?',
    register: 'Registruj je besplatno',
    googleError: 'Prijava s Googleom nije uspjela. Pokušaj ponovo.',
  },
  en: {
    skip: 'Skip',
    next: 'Next',
    start: 'Get started',
    slides: [
      { t1: 'Find a business', t2: 'in your city', s: 'Hairdressers, car washes, apartments, construction and more, all in one place.' },
      { t1: 'Pick a free', t2: 'time slot', s: 'You only see free times, no calls or messages.' },
      { t1: 'Instant confirmation,', t2: 'reminder a day before', s: 'Nothing to remember, we let you know in time.' },
    ],
    cats: ['Hair', 'Car wash', 'Apartments', 'Health', 'Solar', 'Building'],
    search: 'Hairdresser in Mostar…',
    confirmed: 'Booking confirmed',
    confirmedSub: 'Tomorrow at 10:30 · reminder on the way',
    reminder: 'Reminder',
    reminderSub: 'Your booking is tomorrow at 10:30',
    welcome: 'Welcome',
    welcomeSub: 'Sign in to book your first appointment.',
    google: 'Continue with Google',
    email: 'Sign in with email',
    owner: 'Own a business?',
    register: 'Register it for free',
    googleError: 'Google sign-in failed. Please try again.',
  },
};

type Stage = 'logo' | 'intro' | 'login';

const CAT_COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.4 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function AppStart() {
  const router = useRouter();
  const t = useT(TEXT);
  const [stage, setStage] = useState<Stage>('logo');
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const touch = useRef<number | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('poslo_app', '1');
      document.documentElement.classList.add('app-mode', 'app-ui');
    } catch {}

    let cancelled = false;
    const started = Date.now();
    // Logo ostaje barem ~1 s, da se lijepo vidi nastavak Android ekrana s logom.
    const after = (fn: () => void) => setTimeout(() => !cancelled && fn(), Math.max(0, 1000 - (Date.now() - started)));

    (async () => {
      let signedIn = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        signedIn = Boolean(session);
      } catch {}
      if (signedIn) {
        after(() => router.replace('/'));
        return;
      }
      let seen = false;
      try {
        seen = localStorage.getItem(INTRO_KEY) === '1';
      } catch {}
      after(() => setStage(seen ? 'login' : 'intro'));
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const finishIntro = () => {
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {}
    setStage('login');
  };

  const nextSlide = () => (slide < 2 ? setSlide(slide + 1) : finishIntro());

  const google = async () => {
    setBusy(true);
    setError('');
    const redirectTo = new URL('/nalog', window.location.origin);
    redirectTo.searchParams.set('next', '/');
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo.toString() } });
    if (authError) {
      setError(t.googleError);
      setBusy(false);
    }
  };

  // Položaj loga: u sredini (kao Android ekran), pa se lagano pomjeri gore za uvod ili prijavu.
  const logoStyle =
    stage === 'logo'
      ? { top: '50%', transform: 'translate(-50%, -50%) scale(1)' }
      : stage === 'intro'
        ? { top: 'calc(env(safe-area-inset-top) + 2.75rem)', transform: 'translate(-50%, -50%) scale(0.42)' }
        : { top: '30%', transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0 };

  const illustrations: ReactNode[] = [
    <div key="a" className="w-full max-w-[300px]">
      <div className="mb-4 flex h-14 items-center gap-3 rounded-full border border-blue-400/30 bg-[#0f172a] px-5 text-[15px] text-slate-500 shadow-2xl">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        {t.search}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {t.cats.map((c, i) => (
          <div key={c} className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#0f172a] py-4 shadow-xl">
            <span className="h-9 w-9 rounded-xl" style={{ backgroundColor: CAT_COLORS[i] }} />
            <span className="text-[12px] font-semibold text-slate-200">{c}</span>
          </div>
        ))}
      </div>
    </div>,
    <div key="b" className="relative h-[230px] w-[230px] rounded-[32px] border-2 border-blue-400/30 bg-[#0f172a] shadow-2xl">
      <div className="h-14 rounded-t-[30px] bg-blue-600" />
      <span className="absolute -top-4 left-12 h-11 w-3.5 rounded-full bg-slate-200" />
      <span className="absolute -top-4 right-12 h-11 w-3.5 rounded-full bg-slate-200" />
      <div className="grid grid-cols-4 gap-3 p-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`h-8 rounded-lg ${i === 6 ? 'bg-blue-400' : 'bg-slate-800'}`} />
        ))}
      </div>
    </div>,
    <div key="c" className="w-full max-w-[320px] space-y-3">
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#111827] p-4 shadow-2xl">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
        </span>
        <div>
          <p className="text-[15px] font-bold text-white">{t.confirmed}</p>
          <p className="text-[12px] text-slate-400">{t.confirmedSub}</p>
        </div>
      </div>
      <div className="ml-6 flex items-center gap-3 rounded-3xl border border-white/[0.07] bg-[#111827]/90 p-4 shadow-xl">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm0 18a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 21z" /></svg>
        </span>
        <div>
          <p className="text-[14px] font-bold text-white">{t.reminder}</p>
          <p className="text-[12px] text-slate-400">{t.reminderSub}</p>
        </div>
      </div>
    </div>,
  ];

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#030712] text-white">
      {/* Sjaj u pozadini se pojavi tek kad logo krene gore, da prvi trenutak bude isti kao Android ekran. */}
      <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${stage === 'logo' ? 'opacity-0' : 'opacity-100'}`}>
        {/* Sjaj je obični prelaz boja (bez blur filtera): iPhone je pri animacijama iza blura crtao crne pravougaonike. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(37,99,235,0.28),transparent_45%),radial-gradient(circle_at_95%_58%,rgba(124,58,237,0.22),transparent_45%)]" />
      </div>

      <div
        className="pointer-events-none fixed left-1/2 z-20 transition-[top,transform,opacity] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={logoStyle}
      >
        <Image src="/poslo.one.png" alt="POSLO ONE" width={120} height={120} priority className={`h-[120px] w-[120px] ${stage === 'logo' ? 'app-logo-breathe' : ''}`} />
      </div>

      {stage === 'intro' && (
        <div className="app-fade relative z-10 flex min-h-[100dvh] flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center justify-end px-5">
            <button type="button" onClick={finishIntro} className="text-[15px] font-semibold text-slate-400">
              {t.skip}
            </button>
          </div>

          <div
            className="flex flex-1 flex-col overflow-hidden"
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current === null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              touch.current = null;
              if (dx < -50) nextSlide();
              else if (dx > 50 && slide > 0) setSlide(slide - 1);
            }}
          >
            <div className="flex flex-1 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {t.slides.map((s, i) => (
                <section key={i} className="flex w-full shrink-0 flex-col items-center px-7" aria-hidden={i !== slide}>
                  <div className="flex flex-1 items-center justify-center">{illustrations[i]}</div>
                  <h2 className="text-center text-[30px] font-black leading-tight tracking-tight">
                    {s.t1}
                    <br />
                    <span className="text-blue-400">{s.t2}</span>
                  </h2>
                  <p className="mt-3 max-w-[300px] text-center text-[15px] leading-relaxed text-slate-400">{s.s}</p>
                </section>
              ))}
            </div>
          </div>

          <div className="mt-7 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-blue-500' : 'w-3 bg-slate-700'}`} />
            ))}
          </div>

          <div className="px-6 pt-8">
            <button type="button" onClick={nextSlide} className="app-press h-14 w-full rounded-2xl bg-blue-600 text-[16px] font-bold shadow-lg shadow-blue-600/30">
              {slide < 2 ? t.next : t.start}
            </button>
          </div>
        </div>
      )}

      {stage === 'login' && (
        <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
          {/* Logo je ovdje u toku stranice (ne prikovan), pa ga ništa ne može prekriti kad se ekran smanji. */}
          <div className="flex flex-1 flex-col items-center justify-center pb-6">
            <Image src="/poslo.one.png" alt="POSLO ONE" width={132} height={132} priority className="mb-8 h-[132px] w-[132px]" />
            <h1 className="app-rise text-[34px] font-black tracking-tight" style={{ animationDelay: '0.25s' }}>{t.welcome}</h1>
            <p className="app-rise mt-2 text-center text-[15px] text-slate-400" style={{ animationDelay: '0.32s' }}>{t.welcomeSub}</p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-3">
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="app-press app-rise flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-[16px] font-bold text-[#0b1020] disabled:opacity-60"
              style={{ animationDelay: '0.38s' }}
            >
              <GoogleMark /> {t.google}
            </button>
            <Link
              href="/nalog?next=/"
              className="app-press app-rise flex h-14 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-[16px] font-bold"
              style={{ animationDelay: '0.44s' }}
            >
              {t.email}
            </Link>
            <p className="app-rise pt-3 text-center text-[13px] text-slate-400" style={{ animationDelay: '0.5s' }}>
              {t.owner}{' '}
              <Link href="/registracija" className="font-semibold text-blue-300">{t.register}</Link>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
