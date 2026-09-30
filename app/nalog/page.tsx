'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient, type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/katalog';
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
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [name, setName] = useState('');
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
      setError(err instanceof Error ? err.message : 'Termine nije moguće učitati.');
    } finally {
      setLoadingRes(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  const completeAuth = async () => {
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
          options: { data: { full_name: name.trim() } },
        });
        if (authError) throw authError;
        if (data.session) await completeAuth();
        else setMessage('Provjerite email i potvrdite račun, zatim se prijavite.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        await completeAuth();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prijava nije uspjela. Pokušajte ponovo.');
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
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo.toString() },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setReservations([]);
  };

  const cancelReservation = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite otkazati ovaj termin?')) return;
    setCancellingId(id);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesija je istekla. Prijavite se ponovo.');
      const res = await fetch('/api/moje-rezervacije', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      setMessage('Termin je otkazan. Obavijest je poslana na vaš email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Otkazivanje nije uspjelo.');
    } finally {
      setCancellingId(null);
    }
  };

  const inputClass = 'mt-2 w-full rounded-xl border border-[#16264a] bg-[#050a18] px-4 py-3 text-white outline-none focus:border-[#1d5bff]';
  const primaryBtn = 'w-full rounded-xl bg-[#1d5bff] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#3b74ff] disabled:opacity-60';
  const secondaryBtn = 'w-full rounded-xl border border-[#16264a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60';

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-[#050a18] text-slate-400">Učitavanje...</main>;
  }

  // ---------- PRIJAVLJEN: nalog i termini ----------
  if (user) {
    const displayName = (user.user_metadata?.full_name as string | undefined) || user.email;
    const key = nowKey();
    const upcoming = reservations.filter((r) => splitDate(r.reservation_date).sortKey >= key);
    const past = reservations.filter((r) => splitDate(r.reservation_date).sortKey < key).reverse();

    return (
      <main className="min-h-screen bg-[#050a18] px-4 py-10 text-white">
        <div className="mx-auto w-full max-w-2xl">
          <Link href="/katalog" className="text-sm font-semibold text-blue-400 hover:text-blue-300">← Nazad na katalog</Link>

          <section className="mt-6 rounded-2xl border border-[#16264a] bg-gradient-to-br from-[#0a1226] to-[#0b1d45] p-7 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">POSLO ONE · moj nalog</p>
            <h1 className="mt-3 text-3xl font-black">Zdravo, {displayName}</h1>
            <p className="mt-2 text-sm text-slate-400">Prijavljeni ste kao {user.email}. Ostajete prijavljeni na ovom uređaju, pa termine možete zakazivati bez ponovne prijave.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/katalog" className="rounded-xl bg-[#1d5bff] px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#3b74ff]">Zakaži novi termin</Link>
              <button type="button" onClick={handleSignOut} className={secondaryBtn}>Odjavi se</button>
            </div>
          </section>

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

          <h2 className="mt-10 text-xl font-black">Predstojeći termini</h2>
          {loadingRes ? (
            <p className="mt-4 text-sm text-slate-400">Učitavanje termina...</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-[#16264a] bg-[#0a1226] p-5 text-sm text-slate-400">Nemate zakazanih termina.</p>
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
                        <p className="mt-1 text-sm text-slate-300">{d.date} u {d.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-400">{r.price}</p>
                        {r.status && <span className="mt-1 inline-block rounded-full border border-[#1d5bff]/40 bg-[#1d5bff]/10 px-3 py-1 text-xs font-semibold text-blue-300">{r.status}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelReservation(r.id)}
                      disabled={cancellingId === r.id}
                      className="mt-4 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-60"
                    >
                      {cancellingId === r.id ? 'Otkazujem...' : 'Otkaži termin'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-black text-slate-300">Prošli termini</h2>
              <div className="mt-4 space-y-3">
                {past.map((r) => {
                  const d = splitDate(r.reservation_date);
                  return (
                    <article key={r.id} className="rounded-2xl border border-[#16264a] bg-[#0a1226]/60 p-5 opacity-70">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{r.business_name}</p>
                      <h3 className="mt-1 font-bold">{r.service_name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{d.date} u {d.time} · {r.price}</p>
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
    <main className="flex min-h-screen items-center justify-center bg-[#050a18] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-[#16264a] bg-gradient-to-br from-[#0a1226] to-[#0b1d45] p-7 shadow-2xl sm:p-9">
        <Link href="/katalog" className="text-xs font-semibold text-blue-400 hover:text-blue-300">← Nazad na katalog</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">POSLO ONE · rezervacije</p>
        <h1 className="mt-3 text-3xl font-black">{isRegistering ? 'Kreiraj korisnički račun' : 'Prijavi se'}</h1>
        <p className="mt-2 text-sm text-slate-400">Vaš račun čuva rezervacije, pokazuje vaše zakazane termine i omogućava brže ponovno zakazivanje.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegistering && <label className="block text-sm text-slate-300">Ime i prezime
            <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>}
          <label className="block text-sm text-slate-300">Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm text-slate-300">Lozinka
            <input required type="password" minLength={6} autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </label>
          <button disabled={loading} className={primaryBtn}>
            {loading ? 'Molimo sačekajte...' : isRegistering ? 'Registruj se' : 'Prijavi se'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-[#16264a]" />ili<span className="h-px flex-1 bg-[#16264a]" /></div>
        <button type="button" onClick={continueWithGoogle} disabled={loading} className={secondaryBtn}>Nastavi s Googleom</button>
        <button type="button" onClick={() => { setIsRegistering((v) => !v); setError(''); setMessage(''); }} className="mt-5 w-full text-sm text-blue-400 hover:text-blue-300">
          {isRegistering ? 'Već imate račun? Prijavite se' : 'Nemate račun? Registrujte se'}
        </button>
      </section>
    </main>
  );
}