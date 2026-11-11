'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useBusiness } from '../_lib/business-context';
import Icon from '../_components/icons';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';

export default function ReferralsPage() {
  const { business } = useBusiness();
  const [stats, setStats] = useState<{ total: number; active: number } | null>(null);
  const [copied, setCopied] = useState<'link' | 'msg' | ''>('');
  const [origin, setOrigin] = useState('https://poslo.one');

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/dashboard/referrals', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const json = await res.json();
        setStats({ total: Number(json.total) || 0, active: Number(json.active) || 0 });
      }
    })().catch(() => undefined);
  }, []);

  const link = business.slug ? `${origin}/registracija?ref=${business.slug}` : '';
  const message =
    `Ja koristim POSLO ONE za online zakazivanje termina. Klijenti zakazuju sami, a ja dobijem obavijest. ` +
    `Prvih 30 dana je besplatno, a sve ti postave oni. Probaj preko mog linka: ${link}`;

  const copy = async (text: string, what: 'link' | 'msg') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      /* clipboard nije dostupan */
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Preporuči i zaradi</h2>
        <p className="mt-1 text-sm text-slate-400">
          Za svaku firmu koja se registruje preko vašeg linka i počne koristiti POSLO ONE, dobijate mjesec korištenja besplatno.
        </p>
      </div>

      <section className={panel}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Registrovano preko vas', value: stats ? stats.total : '–' },
            { label: 'Aktivne firme', value: stats ? stats.active : '–' },
            { label: 'Besplatnih mjeseci', value: stats ? stats.active : '–' },
          ].map((item) => (
            <div key={item.label} className="rounded-[calc(var(--po-radius)*0.7)] bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${panel} space-y-4`}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Icon name="link" className="h-4 w-4" />
          </span>
          <h3 className="font-display text-[15px] font-semibold tracking-tight text-white">Vaš link za preporuku</h3>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 truncate rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-slate-200">
            {link || 'Link se učitava...'}
          </code>
          <button
            type="button"
            disabled={!link}
            onClick={() => copy(link, 'link')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.6)] bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
          >
            <Icon name="copy" className="h-4 w-4" />
            {copied === 'link' ? 'Kopirano' : 'Kopiraj link'}
          </button>
        </div>

        <div className="rounded-[calc(var(--po-radius)*0.7)] bg-white/[0.03] p-4">
          <p className="text-xs font-medium text-slate-300">Gotova poruka za WhatsApp ili Viber</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!link}
              onClick={() => copy(message, 'msg')}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:border-blue-500/40 disabled:opacity-50"
            >
              <Icon name="copy" className="h-3.5 w-3.5 text-blue-400" />
              {copied === 'msg' ? 'Kopirano' : 'Kopiraj poruku'}
            </button>
            {link && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40"
              >
                <Icon name="message" className="h-3.5 w-3.5 text-emerald-400" />
                Pošalji na WhatsApp
              </a>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Besplatni mjesec se dodaje kad preporučena firma bude odobrena i aktivna. Za pitanja nas nazovite.
        </p>
      </section>
    </div>
  );
}
