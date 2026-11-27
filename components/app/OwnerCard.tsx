'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Icon from '../Icon';
import { useT } from '../site/LangProvider';
import { readQuick, writeQuick } from '../../utils/quickCache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Summary = { name: string; logo: string | null; slug: string; today: number; newInquiries: number };

const TEXT = {
  bs: {
    kicker: 'Tvoj biznis',
    today: (n: number) => (n === 0 ? 'Danas nema termina' : n === 1 ? '1 termin danas' : `${n} termina danas`),
    inquiries: (n: number) => (n === 1 ? '1 novi upit' : `${n} novih upita`),
    open: 'Otvori panel',
  },
  en: {
    kicker: 'Your business',
    today: (n: number) => (n === 0 ? 'No bookings today' : n === 1 ? '1 booking today' : `${n} bookings today`),
    inquiries: (n: number) => (n === 1 ? '1 new inquiry' : `${n} new inquiries`),
    open: 'Open panel',
  },
};

// Kartica na vrhu Početne u aplikaciji, samo za vlasnike firmi: brz pregled i ulaz u panel.
export default function OwnerCard() {
  const t = useT(TEXT);
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const key = `owner-sum:${session.user.id}`;
      const cached = readQuick<Summary | false>(key, 5 * 60_000);
      if (cached === false) return; // nije vlasnik
      if (cached) setData(cached);
      const res = await fetch('/api/dashboard/summary', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }).catch(() => null);
      if (stop || !res) return;
      if (res.status === 401 || res.status === 403) {
        writeQuick(key, false);
        setData(null);
        return;
      }
      if (!res.ok) return;
      const json = (await res.json().catch(() => null)) as Summary | null;
      if (!json || stop) return;
      setData(json);
      writeQuick(key, json);
    })();
    return () => {
      stop = true;
    };
  }, []);

  if (!data) return null;

  return (
    <Link
      href="/dashboard"
      className="app-only app-rise mb-6 block rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-600/20 via-gray-900/70 to-violet-600/20 p-4 shadow-xl shadow-blue-900/20"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
          {data.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="building" className="h-6 w-6 text-blue-200" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">{t.kicker}</p>
          <p className="truncate text-base font-bold text-white">{data.name}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
          {t.open} →
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-slate-200">
          <Icon name="calendar" className="h-3.5 w-3.5" /> {t.today(data.today)}
        </span>
        {data.newInquiries > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-amber-300">
            <Icon name="message" className="h-3.5 w-3.5" /> {t.inquiries(data.newInquiries)}
          </span>
        )}
      </div>
    </Link>
  );
}
