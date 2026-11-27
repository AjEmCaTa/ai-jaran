'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Icon from '../../components/Icon';
import { useLang } from '../../components/site/LangProvider';
import { statusText } from '../../utils/bookingText';
import { statusKind } from '../../utils/reservationFlow';
import { readQuick, writeQuick } from '../../utils/quickCache';

// "Termini" u aplikaciji: aktivni i prošli termini korisnika, kao u pravim aplikacijama za rezervacije.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Booking = {
  id: string;
  service_name: string;
  price: string | number | null;
  reservation_date: string;
  status: string | null;
  business_name: string;
  business_slug?: string;
  business_logo?: string;
};

const TEXT = {
  bs: {
    title: 'Termini',
    active: 'Aktivni',
    past: 'Prošli',
    noActive: 'Nemate aktivnih termina',
    noPast: 'Još nemate prošlih termina',
    find: 'Pronađi firmu',
    cancel: 'Otkaži termin',
    again: 'Zakaži ponovo',
    loginTitle: 'Prijavite se da vidite svoje termine',
    login: 'Prijavi se',
    sureTitle: 'Otkazati termin?',
    sureText: 'Firma dobija obavijest da ste otkazali.',
    yes: 'Da, otkaži',
    no: 'Ne',
    cancelled: 'Termin je otkazan.',
    error: 'Nešto nije u redu. Pokušajte ponovo.',
    at: 'u',
  },
  en: {
    title: 'Bookings',
    active: 'Active',
    past: 'Past',
    noActive: 'You have no active bookings',
    noPast: 'No past bookings yet',
    find: 'Find a business',
    cancel: 'Cancel booking',
    again: 'Book again',
    loginTitle: 'Log in to see your bookings',
    login: 'Log in',
    sureTitle: 'Cancel this booking?',
    sureText: 'The business will be notified.',
    yes: 'Yes, cancel',
    no: 'No',
    cancelled: 'The booking is cancelled.',
    error: 'Something went wrong. Please try again.',
    at: 'at',
  },
};

const sortKey = (v: string) => {
  const [d, t] = (v || '').split('T');
  return `${d || ''}T${(t || '00:00').slice(0, 5)}`;
};

const nowKey = () => {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`;
};

const dayLabel = (v: string, lang: 'bs' | 'en') => {
  const [d] = (v || '').split('T');
  const date = new Date(`${d}T12:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'bs-BA', { weekday: 'short', day: 'numeric', month: 'short' });
};

const timeOf = (v: string) => ((v || '').split('T')[1] || '').slice(0, 5);

const TONE: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-300',
  pending: 'bg-amber-500/15 text-amber-300',
  rescheduling: 'bg-violet-500/15 text-violet-300',
  completed: 'bg-white/10 text-slate-300',
};

export default function TerminiPage() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [items, setItems] = useState<Booking[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let stop = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (stop) return;
      if (!session) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      const key = `termini:${session.user.id}`;
      const cached = readQuick<Booking[]>(key, 10 * 60_000);
      if (cached) setItems(cached);
      try {
        const res = await fetch('/api/moje-rezervacije', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
        const json = await res.json();
        if (stop) return;
        if (json.success) {
          setItems(json.data || []);
          writeQuick(key, json.data || []);
        } else if (!cached) setItems([]);
      } catch {
        if (!stop && !cached) setItems([]);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  const doCancel = async (b: Booking) => {
    setBusy(true);
    setNotice('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error();
      const res = await fetch('/api/moje-rezervacije', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id: b.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setItems((cur) => {
        const next = (cur || []).filter((x) => x.id !== b.id);
        writeQuick(`termini:${session.user.id}`, next);
        return next;
      });
      setNotice(t.cancelled);
    } catch (e) {
      setNotice((e as Error)?.message || t.error);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const key = nowKey();
  const all = items || [];
  const active = all
    .filter((b) => sortKey(b.reservation_date) >= key && statusKind(b.status) !== 'completed')
    .sort((a, b) => sortKey(a.reservation_date).localeCompare(sortKey(b.reservation_date)));
  const past = all
    .filter((b) => !(sortKey(b.reservation_date) >= key && statusKind(b.status) !== 'completed'))
    .sort((a, b) => sortKey(b.reservation_date).localeCompare(sortKey(a.reservation_date)));
  const shown = tab === 'active' ? active : past;

  return (
    <main className="min-h-screen bg-[#030712] px-4 pb-10 pt-24 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="web-only mb-4 text-2xl font-black">{t.title}</h1>

        {/* Kartice kao u aplikacijama: aktivni / prošli */}
        <div className="-mx-4 mb-4 grid grid-cols-2 border-b border-white/[0.07]">
          {(['active', 'past'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`relative py-3.5 text-[15px] font-bold transition-colors ${tab === k ? 'text-white' : 'text-slate-500'}`}
            >
              {k === 'active' ? t.active : t.past}
              {k === 'active' && active.length > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] text-white">{active.length}</span>
              )}
              <span className={`absolute inset-x-6 bottom-0 h-[3px] rounded-full transition-colors ${tab === k ? 'bg-blue-500' : 'bg-transparent'}`} />
            </button>
          ))}
        </div>

        {notice && <p className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">{notice}</p>}

        {signedIn === false ? (
          <div className="mt-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300"><Icon name="calendar" className="h-8 w-8" /></span>
            <p className="mt-4 font-semibold text-slate-200">{t.loginTitle}</p>
            <Link href="/nalog?next=/termini" className="mt-5 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold">{t.login}</Link>
          </div>
        ) : items === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/[0.04]" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300"><Icon name="calendar" className="h-8 w-8" /></span>
            <p className="mt-4 font-semibold text-slate-300">{tab === 'active' ? t.noActive : t.noPast}</p>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold">{t.find}</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((b) => {
              const kind = statusKind(b.status);
              return (
                <li key={b.id} className="app-item rounded-3xl border border-white/[0.07] bg-gray-900/60 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06]">
                      {b.business_logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.business_logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="building" className="h-6 w-6 text-blue-300" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold uppercase tracking-wider text-blue-300">{b.business_name}</p>
                      <p className="mt-0.5 break-words font-bold text-white">{b.service_name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                        <Icon name="clock" className="h-4 w-4 text-slate-400" />
                        {dayLabel(b.reservation_date, lang)} {timeOf(b.reservation_date) && `${t.at} ${timeOf(b.reservation_date)}`}
                      </p>
                    </div>
                    {b.status && (
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE[kind] || 'bg-white/10 text-slate-300'}`}>
                        {statusText(b.status, lang)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {tab === 'active' ? (
                      <button type="button" onClick={() => setConfirm(b)} className="min-h-10 flex-1 rounded-xl border border-red-500/25 text-sm font-semibold text-red-300">
                        {t.cancel}
                      </button>
                    ) : b.business_slug ? (
                      <Link href={`/katalog/${b.business_slug}`} className="flex min-h-10 flex-1 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-semibold text-white">
                        {t.again}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t.sureTitle}>
          <div className="app-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && setConfirm(null)} />
          <div className="app-sheet relative w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
            <h2 className="text-lg font-bold">{t.sureTitle}</h2>
            <p className="mt-1 text-sm text-slate-400">{confirm.business_name} · {confirm.service_name} · {dayLabel(confirm.reservation_date, lang)} {timeOf(confirm.reservation_date)}</p>
            <p className="mt-2 text-sm text-slate-300">{t.sureText}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirm(null)} className="min-h-11 rounded-xl bg-white/10 text-sm font-semibold">{t.no}</button>
              <button type="button" disabled={busy} onClick={() => doCancel(confirm)} className="min-h-11 rounded-xl bg-red-600 text-sm font-bold disabled:opacity-50">{t.yes}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
