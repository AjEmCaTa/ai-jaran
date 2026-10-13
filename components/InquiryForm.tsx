'use client';

import { useState, type FormEvent } from 'react';

// Univerzalni upit firmi (šalje na /api/business-inquiry; server određuje primaoca po slug-u).
export default function InquiryForm({ businessSlug, accent = 'blue' }: { businessSlug: string; accent?: 'blue' | 'amber' }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const input =
    'w-full rounded-xl border border-white/10 bg-[#030712] px-4 py-3 text-base text-white outline-none sm:text-sm ' +
    (accent === 'amber' ? 'focus:border-amber-500/50' : 'focus:border-blue-500/50');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || sent) return;
    setError('');
    if (name.trim().length < 2) return setError('Unesite ime i prezime.');
    if (!/^[+\d][\d\s()/.-]{5,}$/.test(phone.trim())) return setError('Unesite ispravan broj telefona.');
    if (message.trim().length < 5) return setError('Opišite kratko šta vam treba.');
    setSending(true);
    try {
      const response = await fetch('/api/business-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_slug: businessSlug, name, phone, email, message, website }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success) setSent(true);
      else setError(result?.error || 'Upit nije poslan. Pokušajte ponovo.');
    } catch {
      setError('Greška u mreži. Pokušajte ponovo.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">Hvala! Vaš upit je poslan.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <input className={input} placeholder="Ime i prezime" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
      <input className={input} placeholder="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
      <input className={input} placeholder="E-mail (nije obavezno)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
      <textarea className={input} placeholder="Kako vam možemo pomoći?" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
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
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {sending ? 'Slanje…' : 'Pošalji upit'}
      </button>
    </form>
  );
}
