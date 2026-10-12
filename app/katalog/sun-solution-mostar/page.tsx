'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Background from '../../../components/Background';

const BUSINESS_SLUG = 'sun-solution-mostar';
const BUSINESS_NAME = 'Sun Solution d.o.o. Mostar';
const CATEGORY_NAME = 'Solarni sistemi i elektroinstalacije';
// Dok logo nije dostavljen ostaje null. Nakon dodavanja public/partners/sun-solution.png
// postaviti na '/partners/sun-solution.png'.
const LOGO_SRC: string | null = null;

interface BusinessProfile {
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  work_start: string;
  work_end: string;
  work_days: string[];
}

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  price: number | null;
}

const EMPTY_PROFILE: BusinessProfile = {
  name: BUSINESS_NAME,
  category: CATEGORY_NAME,
  city: '',
  address: '',
  phone: '',
  work_start: '',
  work_end: '',
  work_days: [],
};

export default function SunSolutionPage() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch(`/api/business-profile?slug=${BUSINESS_SLUG}`, { cache: 'no-store' })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        const business = result?.business;
        if (!business) return;
        setProfile({
          name: business.name || BUSINESS_NAME,
          category: business.category || CATEGORY_NAME,
          city: business.city || '',
          address: business.address || '',
          phone: business.phone || '',
          work_start: String(business.work_start || '').slice(0, 5),
          work_end: String(business.work_end || '').slice(0, 5),
          work_days: Array.isArray(business.work_days) ? business.work_days : [],
        });
        setServices(Array.isArray(result.services) ? result.services : []);
      })
      .catch((err) => console.error('Profil biznisa nije učitan:', err))
      .finally(() => setLoaded(true));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || sent) return;
    setFormError('');
    if (name.trim().length < 2) return setFormError('Unesite ime i prezime.');
    if (!/^[+\d][\d\s()/.-]{5,}$/.test(phone.trim())) return setFormError('Unesite ispravan broj telefona.');
    if (email.trim() && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email.trim())) {
      return setFormError('Unesite ispravnu e-mail adresu ili ostavite polje prazno.');
    }
    if (message.trim().length < 5) return setFormError('Opišite kratko šta vam treba.');

    setSending(true);
    try {
      const response = await fetch('/api/business-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_slug: BUSINESS_SLUG,
          name,
          phone,
          email,
          service,
          message,
          website,
        }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success) {
        setSent(true);
      } else {
        setFormError(result?.error || 'Upit nije poslan. Pokušajte ponovo ili nas nazovite.');
      }
    } catch {
      setFormError('Greška u mreži. Provjerite vezu i pokušajte ponovo.');
    } finally {
      setSending(false);
    }
  };

  const telHref = profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, '')}` : '';

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50';

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">
      <Background />
      <Navbar onOpenContact={() => {}} onResetHero={() => {}} onOpenCatalog={() => {}} />

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-32">
        <Link
          href="/katalog/solarni-sistemi"
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-2.5 text-xs font-semibold text-gray-400 shadow-sm transition-colors hover:text-amber-400"
        >
          ← Nazad na kategoriju
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 shadow-2xl md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/40 bg-[#030712] text-3xl">
              {LOGO_SRC ? (
                <img src={LOGO_SRC} alt={`${profile.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <span>☀️</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white md:text-4xl">{profile.name}</h1>
              <span className="text-xs font-medium text-amber-400/90">{profile.category}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-white/5 pt-4 text-sm text-gray-300">
            {(profile.address || profile.city) && (
              <p>📍 {[profile.address, profile.city].filter(Boolean).join(', ')}</p>
            )}
            {profile.phone && <p>📞 {profile.phone}</p>}
            {profile.work_days.length > 0 && profile.work_start && (
              <p className="text-gray-400">
                🕒 {profile.work_days.join(' – ')}: {profile.work_start} – {profile.work_end}
              </p>
            )}
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">Usluge</h2>
          {!loaded ? (
            <div className="h-32 animate-pulse rounded-3xl border border-white/10 bg-[#0b0f19]" />
          ) : services.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 text-sm text-gray-400">
              Lista usluga uskoro će biti objavljena. U međuvremenu nam pošaljite upit.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {services.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-[#0b0f19] p-5">
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  {item.description && <p className="mt-2 text-xs leading-relaxed text-gray-400">{item.description}</p>}
                  <p className="mt-3 text-xs text-amber-400">
                    {item.duration ? `Trajanje: ${item.duration}` : ''}
                    {item.duration && item.price ? ' · ' : ''}
                    {item.price ? `Cijena: ${Number(item.price).toLocaleString('bs-BA')} KM` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => setService(item.name)}
                    className="mt-4 rounded-xl border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/10"
                  >
                    Pošalji upit za ovu uslugu
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-[#0b0f19] p-6 md:p-8">
          <h2 className="text-xl font-extrabold">Pošaljite upit</h2>
          <p className="mt-2 mb-5 text-xs leading-relaxed text-gray-400">
            Procjena solarnog sistema i elektroinstalacija najčešće zahtijeva pregled na terenu, pa se ovdje ne
            zakazuje termin. Pošaljite upit i partner će vas kontaktirati radi dogovora.
          </p>
          {sent ? (
            <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-300">
              Hvala! Vaš upit je poslan firmi {profile.name}. Javit će vam se uskoro.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input className={inputClass} placeholder="Ime i prezime" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
                <input className={inputClass} placeholder="Telefon" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className={inputClass} type="email" placeholder="E-mail (nije obavezno)" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
                <input
                  className={inputClass}
                  placeholder="Usluga (npr. solarni sistem, elektroinstalacije)"
                  maxLength={150}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
                <textarea
                  className={`${inputClass} md:col-span-2`}
                  rows={4}
                  maxLength={2000}
                  placeholder="Opišite šta vam treba (lokacija, objekat, okvirna potrošnja…)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              {formError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {formError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-2xl bg-amber-600 px-6 py-3 text-xs font-bold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'Slanje…' : 'Pošalji upit'}
                </button>
                {telHref && (
                  <a href={telHref} className="rounded-2xl border border-white/10 px-6 py-3 text-xs font-bold text-white hover:border-amber-500/40">
                    Nazovite {profile.phone}
                  </a>
                )}
              </div>
            </form>
          )}
        </section>
      </div>

      <Footer onOpenPrivacy={() => {}} />
    </main>
  );
}
