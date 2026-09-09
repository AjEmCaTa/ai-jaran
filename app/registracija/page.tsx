'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default function RegistracijaPage() {
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const authResult = await supabase.auth.signUp({
        email,
        password,
      });

      if (authResult.error) throw authResult.error;
      if (!authResult.data.user) throw new Error('Nalog nije kreiran, pokusaj ponovo.');

      const baseSlug = slugify(businessName);
      const uniqueSlug = baseSlug + '-' + Math.floor(Math.random() * 10000);

      const businessResult = await supabase
        .from('businesses')
        .insert([{
          name: businessName,
          slug: uniqueSlug,
          category: category || null,
          city: city || null,
          phone: phone || null,
          owner_email: email,
          status: 'pending'
        }])
        .select()
        .single();

      if (businessResult.error) throw businessResult.error;

      const profileResult = await supabase
        .from('profiles')
        .insert([{
          id: authResult.data.user.id,
          email: email,
          name: ownerName,
          business_id: businessResult.data.id,
          must_change_password: false
        }]);

      if (profileResult.error) throw profileResult.error;

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Doslo je do greske prilikom registracije.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="relative min-h-screen bg-[#030712] text-white flex items-center justify-center px-4 py-12">
        <div className="relative z-10 w-full max-w-md rounded-[28px] border border-emerald-500/30 bg-[#080d1c]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl">
            OK
          </div>
          <h1 className="text-2xl font-extrabold text-white">Nalog je kreiran!</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tvoj nalog trenutno ceka odobrenje. Kontaktiraj nas na Viber/WhatsApp da zavrsimo dogovor oko Pro paketa - cim uplata bude potvrdjena, tvoj dashboard ce biti aktiviran.
          </p>
          <a
            href="https://wa.me/3"
            target="_blank"
            className="inline-flex items-center justify-center w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm"
          >
            Kontaktiraj nas na WhatsApp
          </a>
          <Link href="/" className="block text-xs text-slate-500 hover:text-white transition">
            Nazad na pocetnu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#030712] text-white flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#080d1c]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-400 hover:text-white transition-colors duration-200 group"
          >
            Nazad na pocetnu
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            Registruj svoj biznis
          </h1>
          <p className="text-slate-400 text-sm">
            Kreiraj nalog za POSLO ONE Pro paket. Dashboard se aktivira nakon potvrde uplate.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Ime i prezime</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Naziv biznisa</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="npr. Frizerski salon Ana"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Grad</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mostar"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="061 123 456"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Djelatnost</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="npr. frizer, cistac, apartmani..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Lozinka</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 karaktera"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? "Kreiranje naloga..." : "Kreiraj nalog"}
          </button>
        </form>
      </div>
    </main>
  );
}
