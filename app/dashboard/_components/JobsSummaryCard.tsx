'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { summarizeJobs, type JobRow } from '../../../utils/jobs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

const km = (n: number) => `${n.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;

// Kontrolna ploča za firme koje rade po upitima: zarada iz Poslova, ne iz cijena rezervacija.
export default function JobsSummaryCard({ onRevenue }: { onRevenue?: (monthRevenue: number) => void }) {
  const [sum, setSum] = useState<ReturnType<typeof summarizeJobs> | null>(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/dashboard/inquiries', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }).catch(() => null);
      const json = res?.ok ? await res.json().catch(() => null) : null;
      if (stop || !json) return;
      const s = summarizeJobs(Array.isArray(json.inquiries) ? (json.inquiries as JobRow[]) : []);
      setSum(s);
      onRevenue?.(s.monthRevenue);
    })();
    return () => {
      stop = true;
    };
  }, [onRevenue]);

  const tile = 'rounded-xl bg-white/[0.04] p-3';
  return (
    <section className="min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur" aria-label="Poslovi">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-white">Poslovi</h2>
        <Link href="/dashboard/inquiries" className="text-sm font-semibold text-blue-300 hover:text-blue-200">Otvori →</Link>
      </div>
      {!sum ? (
        <div className="mt-3 h-20 animate-pulse rounded-xl bg-white/5" />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className={tile}>
            <p className="text-[11px] text-gray-400">Zarada ovaj mjesec</p>
            <p className={`mt-0.5 text-lg font-bold ${sum.monthProfit < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{km(sum.monthProfit)}</p>
          </div>
          <div className={tile}>
            <p className="text-[11px] text-gray-400">Ove godine</p>
            <p className="mt-0.5 text-lg font-bold text-white">{km(sum.yearProfit)}</p>
          </div>
          <div className={tile}>
            <p className="text-[11px] text-gray-400">Klijenti duguju</p>
            <p className={`mt-0.5 text-lg font-bold ${sum.owed > 0 ? 'text-amber-300' : 'text-white'}`}>{km(sum.owed)}</p>
          </div>
          <div className={tile}>
            <p className="text-[11px] text-gray-400">U toku</p>
            <p className="mt-0.5 text-lg font-bold text-white">{sum.open}</p>
          </div>
        </div>
      )}
    </section>
  );
}
