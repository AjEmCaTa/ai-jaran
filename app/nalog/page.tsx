'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient, type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '../../components/PasswordInput';
import { useLang } from '../../components/site/LangProvider';
import { authErrorText } from '../../utils/authErrors';
import { statusText } from '../../utils/bookingText';

const TEXT = {
  bs: {
    loadError: 'Termine nije moguće učitati.', confirmEmail: 'Poslali smo vam e-mail. Otvorite link u njemu da potvrdite nalog, pa se prijavite. Provjerite i folder Spam.', loginFailed: 'Prijava nije uspjela. Pokušajte ponovo.',
    confirmCancel: 'Jeste li sigurni da želite otkazati ovaj termin?', expired: 'Sesija je istekla. Prijavite se ponovo.', cancelled: 'Termin je otkazan. Obavijest je poslana na vaš email.',
    cancelFailed: 'Otkazivanje nije uspjelo.', back: '← Nazad na katalog', myAccount: 'POSLO ONE · moj nalog', hello: 'Zdravo,',
    loggedAs: (e: string) => `Prijavljeni ste kao ${e}. Ostajete prijavljeni na ovom uređaju, pa termine možete zakazivati bez ponovne prijave.`,
    bookNew: 'Zakaži novi termin', signOut: 'Odjavi se', upcoming: 'Predstojeći termini', loadingRes: 'Učitavanje termina...', none: 'Nemate zakazanih termina.',
    at: 'u', cancelling: 'Otkazujem...', cancel: 'Otkaži termin', past: 'Prošli termini', bookings: 'POSLO ONE · rezervacije',
    createAccount: 'Kreiraj korisnički račun', login: 'Prijavi se', why: 'Vaš račun čuva rezervacije, pokazuje vaše zakazane termine i omogućava brže ponovno zakazivanje.',
    fullName: 'Ime i prezime', password: 'Lozinka', wait: 'Molimo sačekajte...', register: 'Registruj se', or: 'ili', google: 'Nastavi s Googleom',
    haveAccount: 'Već imate račun? Prijavite se', noAccount: 'Nemate račun? Registrujte se',
    news: 'Želim primati novosti i ponude od POSLO ONE na e-mail. Odjava je moguća bilo kada.',
  },
  en: {
    loadError: 'Could not load your bookings.', confirmEmail: 'Check your email and confirm your account, then log in.', loginFailed: 'Login failed. Please try again.',
    confirmCancel: 'Are you sure you want to cancel this booking?', expired: 'Your session has expired. Please log in again.', cancelled: 'The booking is cancelled. A confirmation was sent to your email.',
    cancelFailed: 'Cancellation failed.', back: '← Back to catalog', myAccount: 'POSLO ONE · my account', hello: 'Hi,',
    loggedAs: (e: string) => `You are logged in as ${e}. You stay logged in on this device, so you can book without logging in again.`,
    bookNew: 'Book a new appointment', signOut: 'Log out', upcoming: 'Upcoming bookings', loadingRes: 'Loading bookings...', none: 'You have no bookings.',
    at: 'at', cancelling: 'Cancelling...', cancel: 'Cancel booking', past: 'Past bookings', bookings: 'POSLO ONE · bookings',
    createAccount: 'Create an account', login: 'Log in', why: 'Your account keeps your bookings, shows your appointments and makes booking again faster.',
    fullName: 'Full name', password: 'Password', wait: 'Please wait...', register: 'Sign up', or: 'or', google: 'Continue with Google',
    haveAccount: 'Already have an account? Log in', noAccount: "Don't have an account? Sign up",
    news: 'I want to receive news and offers from POSLO ONE by email. You can unsubscribe anytime.',
  },
};

const NEWS_KEY = 'poslo_news_opt_in';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Reservation = {
  id: string;
  service_name: string;
  price: string;
  reservation_date: string;
  status: string | null;
  business_name: string;
};

function safeReturnPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}

// Vraca putanju iz ?next=... ili null ako je nema
function getNextParam() {
  const value = new URLSearchParams(window.location.search).get('next');
  return value ? safeReturnPath(value) : null;
}

function splitDate(value: string) {
  const [d, t] = (value || '').split('T');
  const parts = (d || '').split('-');
  const date = parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] + '.' : d;
  return { date, time: t ? t.slice(0, 5) : '', sortKey: (d || '') + 'T' + (t ? t.slice(0, 5) : '00:00') };
}

function nowKey() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function CustomerAuthPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = TEXT[lang];
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [newsOptIn, setNewsOptIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadReservations = async (token: string) => {
    setLoadingRes(true);
    try {
      const res = await fetch('/api/moje-rezervacije', { headers: { Authorization: 'Bearer ' + token } });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setReservations(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError);
    } finally {
      setLoadingRes(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) syncNewsOptIn(session);
      const next = getNextParam();
      if (session && next) {
        router.replace(next);
        return;
      }
      setUser(session?.user ?? null);
      setChecking(false);
      if (session) loadReservations(session.access_token);
    });
  }, [router]);

  // Pristanak za novosti spremamo tek kad postoji sesija (i nakon Google prijave ili potvrde e-maila).
  const syncNewsOptIn = (session: { access_token: string; user: { user_metadata?: Record<string, unknown> } }) => {
    try {
      const meta = session.user.user_metadata || {};
      const wants = meta.news_opt_in === true || localStorage.getItem(NEWS_KEY) === '1';
      if (wants && !meta.news_opt_in_saved) {
        fetch('/api/nalog/novosti', { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token }, keepalive: true }).catch(() => {});
      }
      localStorage.removeItem(NEWS_KEY);
    } catch {}
  };

  const completeAuth = async () => {
    const { data: { session: fresh } } = await supabase.auth.getSession();
    if (fresh) syncNewsOptIn(fresh);
    const next = getNextParam();
    if (next) {
      router.replace(next);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session) loadReservations(session.access_token);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isRegistering) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim(), ...(newsOptIn ? { news_opt_in: true } : {}) },
            // Link za potvrdu e-maila vraća na ovu stranicu (i na termin koji je klijent zakazivao).
            emailRedirectTo: (() => {
              const u = new URL('/nalog', window.location.origin);
              const next = getNextParam();
              if (next) u.searchParams.set('next', next);
              return u.toString();
            })(),
          },
        });
        if (authError) throw authError;
        // Supabase za već postojeći e-mail ne vraća grešku, nego korisnika bez identiteta.
        if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error('User already registered');
        if (data.session) await completeAuth();
        else setMessage(t.confirmEmail);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        await completeAuth();
      }
    } catch (err) {
      setError(authErrorText(err, lang, t.loginFailed));
    } finally {
      setLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    setLoading(true);
    setError('');
    const redirectTo = new URL('/nalog', window.location.origin);
    const next = getNextParam();
    if (next) redirectTo.searchParams.set('next', next);
    try {
      if (isRegistering && newsOptIn) localStorage.setItem(NEWS_KEY, '1');
    } catch {}
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo.toString() },
    });
    if (authError) {
      setError(authErrorText(authError, lang, t.loginFailed));
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setReservations([]);
  };

  const cancelReservation = async (id: string) => {
    if (!window.confirm(t.confirmCancel)) return;
    setCancellingId(id);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t.expired);
      const res = await fetch('/api/moje-rezervacije', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      setMessage(t.cancelled);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.cancelFailed);
    } finally {
      setCancellingId(null);
    }
  };

  const inputClass = 'mt-2 w-full rounded-xl border border-[#16264a] bg-[#050a18] px-4 py-3 text-white outline-none focus:border-[#1d5bff]';
  const primaryBtn = 'w-full rounded-xl bg-[#1d5bff] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#3b74ff] disabled:opacity-60';
  const secondaryBtn = 'w-full rounded-xl border border-[#16264a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60';

  if (checking) {
    // Kostur stranice dok se provjerava prijava, umjesto praznog ekrana.
    return (
      <main className="min-h-screen bg-[#050a18] px-4 py-10" aria-busy="true">
        <div className="mx-auto w-full max-w-2xl">
          <div className="h-5 w-32 animate-pulse rounded bg-white/5" />
          <div className="mt-6 h-56 animate-pulse rounded-2xl border border-[#16264a] bg-[#0a1226]" />
          <div className="mt-10 h-6 w-48 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl border border-[#16264a] bg-[#0a1226]" />
        </div>
      </main>
    );
  }

  // ---------- PRIJAVLJEN: nalog i termini ----------
  if (user) {
    const displayName = (user.user_metadata?.full_name as string | undefined) || user.email;
    const key = nowKey();
    const upcoming = reservations.filter((r) => splitDate(r.reservation_date).sortKey >= key);
    const past = reservations.filter((r) => splitDate(r.reservation_date).sortKey < key).reverse();

    return (
      <main className="min-h-screen bg-[#050a18] px-4 py-10 text-white">
        <div className="fade-in mx-auto w-full max-w-2xl">
          <Link href="/#djelatnosti" className="web-only text-sm font-semibold text-blue-400 hover:text-blue-300">{t.back}</Link>

          <section className="mt-6 rounded-2xl border border-[#16264a] bg-gradient-to-br from-[#0a1226] to-[#0b1d45] p-7 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">{t.myAccount}</p>
            <h1 className="mt-3 text-3xl font-black">{t.hello} {displayName}</h1>
            <p className="mt-2 text-sm text-slate-400">{t.loggedAs(user.email || '')}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/#djelatnosti" className="rounded-xl bg-[#1d5bff] px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#3b74ff]">{t.bookNew}</Link>
              <button type="button" onClick={handleSignOut} className={secondaryBtn}>{t.signOut}</button>
            </div>
          </section>

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

          <h2 className="mt-10 text-xl font-black">{t.upcoming}</h2>
          {loadingRes ? (
            <p className="mt-4 text-sm text-slate-400">{t.loadingRes}</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-[#16264a] bg-[#0a1226] p-5 text-sm text-slate-400">{t.none}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {upcoming.map((r) => {
                const d = splitDate(r.reservation_date);
                return (
                  <article key={r.id} className="rounded-2xl border border-[#16264a] bg-[#0a1226] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {r.business_name && <p className="text-xs font-bold uppercase tracking-wider text-blue-400">{r.business_name}</p>}
                        <h3 className="mt-1 text-lg font-bold">{r.service_name}</h3>
                        <p className="mt-1 text-sm text-slate-300">{d.date} {t.at} {d.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-400">{r.price}</p>
                        {r.status && <span className="mt-1 inline-block rounded-full border border-[#1d5bff]/40 bg-[#1d5bff]/10 px-3 py-1 text-xs font-semibold text-blue-300">{statusText(r.status, lang)}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelReservation(r.id)}
                      disabled={cancellingId === r.id}
                      className="mt-4 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-60"
                    >
                      {cancellingId === r.id ? t.cancelling : t.cancel}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-black text-slate-300">{t.past}</h2>
              <div className="mt-4 space-y-3">
                {past.map((r) => {
                  const d = splitDate(r.reservation_date);
                  return (
                    <article key={r.id} className="rounded-2xl border border-[#16264a] bg-[#0a1226]/60 p-5 opacity-70">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{r.business_name}</p>
                      <h3 className="mt-1 font-bold">{r.service_name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{d.date} {t.at} {d.time} · {r.price}</p>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // ---------- NIJE PRIJAVLJEN: prijava / registracija ----------
  return (
    <main className="auth-main flex min-h-screen items-center justify-center bg-[#050a18] px-4 py-10 text-white">
      <section className="auth-card fade-in w-full max-w-md rounded-2xl border border-[#16264a] bg-gradient-to-br from-[#0a1226] to-[#0b1d45] p-7 shadow-2xl sm:p-9">
        <Link href="/#djelatnosti" className="web-only text-xs font-semibold text-blue-400 hover:text-blue-300">{t.back}</Link>
        <p className="auth-extra mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">{t.bookings}</p>
        <h1 className="auth-title mt-3 text-3xl font-black">{isRegistering ? t.createAccount : t.login}</h1>
        <p className="auth-extra mt-2 text-sm text-slate-400">{t.why}</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegistering && <label className="block text-sm text-slate-300">{t.fullName}
            <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>}
          <label className="block text-sm text-slate-300">Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm text-slate-300">{t.password}
            <PasswordInput required minLength={6} autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </label>
          {!isRegistering && (
            <Link href="/zaboravljena-lozinka?nazad=/nalog" className="-mt-1 inline-block text-xs font-medium text-blue-400 hover:text-blue-300">
              {lang === 'en' ? 'Forgot password?' : 'Zaboravili ste lozinku?'}
            </Link>
          )}
          {isRegistering && (
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-400">
              <input type="checkbox" checked={newsOptIn} onChange={(e) => setNewsOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500" />
              <span>{t.news}</span>
            </label>
          )}
          <button disabled={loading} className={primaryBtn}>
            {loading ? t.wait : isRegistering ? t.register : t.login}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-[#16264a]" />{t.or}<span className="h-px flex-1 bg-[#16264a]" /></div>
        <button type="button" onClick={continueWithGoogle} disabled={loading} className={secondaryBtn}>{t.google}</button>
        <button type="button" onClick={() => { setIsRegistering((v) => !v); setError(''); setMessage(''); }} className="mt-5 w-full text-sm text-blue-400 hover:text-blue-300">
          {isRegistering ? t.haveAccount : t.noAccount}
        </button>
      </section>
    </main>
  );
}