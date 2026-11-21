'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Footer from '../../../components/Footer';
import PartnerLogo from '../../../components/PartnerLogo';
import Icon from '../../../components/Icon';
import { formatServicePrice } from '../../../utils/servicePrice';
import { useLang } from '../../../components/site/LangProvider';
import { categoryLabel } from '../../../utils/catalog';

const DAY_EN: Record<string, string> = { pon: 'Mon', uto: 'Tue', sri: 'Wed', cet: 'Thu', čet: 'Thu', pet: 'Fri', sub: 'Sat', ned: 'Sun' };

const TEXT = {
  bs: {
    errName: 'Unesite ime i prezime.', errPhone: 'Unesite ispravan broj telefona.', errEmail: 'Unesite ispravnu e-mail adresu ili ostavite polje prazno.',
    errMessage: 'Opišite kratko šta vam treba.', errSend: 'Upit nije poslan. Pokušajte ponovo ili nas nazovite.', errNet: 'Greška u mreži. Provjerite vezu i pokušajte ponovo.',
    back: '← Nazad na kategoriju', services: 'Usluge', noServices: 'Lista usluga uskoro će biti objavljena. U međuvremenu nam pošaljite upit.',
    duration: 'Trajanje', price: 'Cijena', askService: 'Pošalji upit za ovu uslugu', formTitle: 'Pošaljite upit',
    formText: 'Procjena solarnog sistema i elektroinstalacija najčešće zahtijeva pregled na terenu, pa se ovdje ne zakazuje termin. Pošaljite upit i partner će vas kontaktirati radi dogovora.',
    thanks: (n: string) => `Hvala! Vaš upit je poslan firmi ${n}. Javit će vam se uskoro.`,
    name: 'Ime i prezime', phone: 'Telefon', email: 'E-mail (nije obavezno)', service: 'Usluga (npr. solarni sistem, elektroinstalacije)',
    message: 'Opišite šta vam treba (lokacija, objekat, okvirna potrošnja…)', sending: 'Slanje…', send: 'Pošalji upit', call: 'Nazovite',
  },
  en: {
    errName: 'Please enter your full name.', errPhone: 'Please enter a valid phone number.', errEmail: 'Please enter a valid email address or leave the field empty.',
    errMessage: 'Please briefly describe what you need.', errSend: 'Your inquiry was not sent. Please try again or call us.', errNet: 'Network error. Check your connection and try again.',
    back: '← Back to category', services: 'Services', noServices: 'The list of services will be published soon. In the meantime, send us an inquiry.',
    duration: 'Duration', price: 'Price', askService: 'Ask about this service', formTitle: 'Send an inquiry',
    formText: 'Assessing a solar system or electrical installation usually requires an on-site visit, so appointments are not booked here. Send an inquiry and the partner will contact you to arrange the details.',
    thanks: (n: string) => `Thank you! Your inquiry was sent to ${n}. They will get back to you soon.`,
    name: 'Full name', phone: 'Phone', email: 'Email (optional)', service: 'Service (e.g. solar system, electrical installation)',
    message: 'Describe what you need (location, building, approximate consumption…)', sending: 'Sending…', send: 'Send inquiry', call: 'Call',
  },
};

const BUSINESS_SLUG = 'sun-solution-mostar';
const BUSINESS_NAME = 'Sun Solution d.o.o. Mostar';
const CATEGORY_NAME = 'Solarni sistemi i elektroinstalacije';

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
  price_on_request?: boolean | null;
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
  const { lang } = useLang();
  const t = TEXT[lang];
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
    if (name.trim().length < 2) return setFormError(t.errName);
    if (!/^[+\d][\d\s()/.-]{5,}$/.test(phone.trim())) return setFormError(t.errPhone);
    if (email.trim() && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email.trim())) {
      return setFormError(t.errEmail);
    }
    if (message.trim().length < 5) return setFormError(t.errMessage);

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
        setFormError(result?.error || t.errSend);
      }
    } catch {
      setFormError(t.errNet);
    } finally {
      setSending(false);
    }
  };

  const telHref = profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, '')}` : '';

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#030712] px-4 py-3 text-base sm:text-sm text-white outline-none focus:border-amber-500/50';

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] font-sans text-white">

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-32">
        <Link
          href="/katalog/solarni-sistemi"
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-2.5 text-xs font-semibold text-gray-400 shadow-sm transition-colors hover:text-amber-400"
        >
          {t.back}
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 shadow-2xl md:p-8">
          <div className="flex items-center gap-4">
            <PartnerLogo slug={BUSINESS_SLUG} name={profile.name} className="h-20 w-20" />
            <div>
              <h1 className="text-2xl font-black text-white md:text-4xl">{profile.name}</h1>
              <span className="text-xs font-medium text-amber-400/90">{lang === 'en' && profile.category === CATEGORY_NAME ? categoryLabel('solarni-sistemi', 'en') : profile.category}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-white/5 pt-4 text-sm text-gray-300">
            {(profile.address || profile.city) && (
              <p className="flex items-center gap-2"><Icon name="mapPin" className="h-4 w-4 flex-none text-amber-400" />{[profile.address, profile.city].filter(Boolean).join(', ')}</p>
            )}
            {profile.phone && <p className="flex items-center gap-2"><Icon name="phone" className="h-4 w-4 flex-none text-amber-400" />{profile.phone}</p>}
            {profile.work_days.length > 0 && profile.work_start && (
              <p className="flex items-center gap-2 text-gray-400">
                <Icon name="clock" className="h-4 w-4 flex-none text-amber-400" />{profile.work_days.map((d) => (lang === 'en' ? DAY_EN[d.trim().toLocaleLowerCase('bs').slice(0, 3)] || d : d)).join(' – ')}: {profile.work_start} – {profile.work_end}
              </p>
            )}
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">{t.services}</h2>
          {!loaded ? (
            <div className="h-32 animate-pulse rounded-3xl border border-white/10 bg-[#0b0f19]" />
          ) : services.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0b0f19] p-6 text-sm text-gray-400">
              {t.noServices}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {services.map((item) => (
                <div key={item.id} className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#0b0f19] p-5">
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  {item.description && <p className="mt-2 text-xs leading-relaxed text-gray-400">{item.description}</p>}
                  <p className="mb-4 mt-3 text-xs text-amber-400">
                    {item.duration ? `${t.duration}: ${item.duration}` : ''}
                    {item.duration && formatServicePrice(item) ? ' · ' : ''}
                    {formatServicePrice(item) ? `${t.price}: ${formatServicePrice(item)}` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => setService(item.name)}
                    className="mt-auto self-start rounded-xl border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/10"
                  >
                    {t.askService}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-[#0b0f19] p-6 md:p-8">
          <h2 className="text-xl font-extrabold">{t.formTitle}</h2>
          <p className="mt-2 mb-5 text-xs leading-relaxed text-gray-400">
            {t.formText}
          </p>
          {sent ? (
            <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-300">
              {t.thanks(profile.name)}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input className={inputClass} placeholder={t.name} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
                <input className={inputClass} placeholder={t.phone} maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className={inputClass} type="email" placeholder={t.email} maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
                <input
                  className={inputClass}
                  placeholder={t.service}
                  maxLength={150}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
                <textarea
                  className={`${inputClass} md:col-span-2`}
                  rows={4}
                  maxLength={2000}
                  placeholder={t.message}
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
                  {sending ? t.sending : t.send}
                </button>
                {telHref && (
                  <a href={telHref} className="rounded-2xl border border-white/10 px-6 py-3 text-xs font-bold text-white hover:border-amber-500/40">
                    {t.call} {profile.phone}
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
