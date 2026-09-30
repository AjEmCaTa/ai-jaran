'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient, type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

function safeReturnPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/katalog';
}

// Vraca putanju iz ?next=... ili null ako je nema
function getNextParam() {
  const value = new URLSearchParams(window.location.search).get('next');
  return value ? safeReturnPath(value) : null;
}

export default function CustomerAuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const next = getNextParam();
      if (session && next) {
        // Dosao je sa zakazivanja: vrati ga odmah nazad
        router.replace(next);
        return;
      }
      setUser(session?.user ?? null);
      setChecking(false);
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
  };

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-[#07110f] text-slate-400">Učitavanje...</main>;
  }

  // ---------- PRIJAVLJEN: prikaz naloga ----------
  if (user) {
    const displayName = (user.user_metadata?.full_name as string | undefined) || user.email;
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-4 py-10 text-white">
        <section className="w-full max-w-md border border-white/10 bg-[#0c1915] p-7 shadow-2xl sm:p-9">
          <Link href="/katalog" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">Nazad na katalog</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">POSLO ONE · moj nalog</p>
          <h1 className="mt-3 text-3xl font-black">Zdravo, {displayName}</h1>
          <p className="mt-2 text-sm text-slate-400">Prijavljeni ste kao {user.email}. Ostajete prijavljeni, pa termine možete zakazivati bez ponovne prijave.</p>

          <Link href="/katalog" className="mt-7 block w-full bg-emerald-400 px-4 py-3.5 text-center text-sm font-bold text-emerald-950 transition hover:bg-emerald-300">
            Zakaži termin
          </Link>
          <button type="button" onClick={handleSignOut} className="mt-3 w-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
            Odjavi se
          </button>
        </section>
      </main>
    );
  }

  // ---------- NIJE PRIJAVLJEN: prijava / registracija ----------
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-4 py-10 text-white">
      <section className="w-full max-w-md border border-white/10 bg-[#0c1915] p-7 shadow-2xl sm:p-9">
        <Link href="/katalog" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">Nazad na katalog</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">POSLO ONE · rezervacije</p>
        <h1 className="mt-3 text-3xl font-black">{isRegistering ? 'Kreiraj korisnički račun' : 'Prijavi se za rezervaciju'}</h1>
        <p className="mt-2 text-sm text-slate-400">Vaš račun čuva rezervacije i omogućava brže ponovno zakazivanje.</p>

        {error && <p role="alert" className="mt-5 border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="mt-5 border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegistering && <label className="block text-sm text-slate-300">Ime i prezime
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#07110f] px-4 py-3 text-white outline-none focus:border-emerald-400" />
          </label>}
          <label className="block text-sm text-slate-300">Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#07110f] px-4 py-3 text-white outline-none focus:border-emerald-400" />
          </label>
          <label className="block text-sm text-slate-300">Lozinka
            <input required type="password" minLength={6} autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#07110f] px-4 py-3 text-white outline-none focus:border-emerald-400" />
          </label>
          <button disabled={loading} className="w-full bg-emerald-400 px-4 py-3.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60">
            {loading ? 'Molimo sačekajte...' : isRegistering ? 'Registruj se' : 'Prijavi se'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-white/10" />ili<span className="h-px flex-1 bg-white/10" /></div>
        <button type="button" onClick={continueWithGoogle} disabled={loading} className="w-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60">Nastavi s Googleom</button>
        <button type="button" onClick={() => { setIsRegistering((value) => !value); setError(''); setMessage(''); }} className="mt-5 w-full text-sm text-emerald-300 hover:text-emerald-200">
          {isRegistering ? 'Već imate račun? Prijavite se' : 'Nemate račun? Registrujte se'}
        </button>
      </section>
    </main>
  );
}
