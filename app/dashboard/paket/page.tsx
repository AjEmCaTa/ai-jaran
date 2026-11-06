'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useBusiness } from '../_lib/business-context';
import Icon from '../_components/icons';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

type Status = {
  plan: 'starter' | 'pro';
  planUntil: string | null;
  billingStatus: string | null;
  hasSubscription: boolean;
  trialEnds: string | null;
  paypal: { enabled: boolean; sandbox: boolean };
};

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    km: 15,
    eur: '7,90 €',
    features: ['Online zakazivanje i stranica firme', 'Obavijesti i podsjetnici', 'Panel za termine i upite', 'Usluge i radno vrijeme uređuje POSLO ONE'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    km: 50,
    eur: '25,90 €',
    features: ['Sve iz Startera', 'Sami mijenjate usluge, cijene i radno vrijeme', 'Zaključani dani i godišnji odmor', 'Recenzije, povratak klijenata, QR poster'],
  },
];

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('bs-BA', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const STATUS_TEXT: Record<string, string> = {
  active: 'Aktivna',
  pending: 'Čeka potvrdu',
  cancelled: 'Otkazana',
  suspended: 'Zaustavljena (neuspjela naplata)',
  expired: 'Istekla',
};

const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';

export default function BillingPage() {
  const { refresh } = useBusiness();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const authHeaders = async (): Promise<Record<string, string> | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : null;
  };

  const load = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch('/api/billing/status', { headers, cache: 'no-store' });
    if (res.ok) setStatus(await res.json());
  }, []);

  // Povratak sa PayPala: potvrda uplate.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subId = params.get('subscription_id');
    const back = params.get('paypal');
    (async () => {
      if (back === 'odustao') setMessage({ tone: 'err', text: 'Plaćanje je prekinuto. Ništa nije naplaćeno.' });
      if (subId) {
        setBusy('confirm');
        const headers = await authHeaders();
        if (headers) {
          const res = await fetch('/api/billing/paypal/confirm', { method: 'POST', headers, body: JSON.stringify({ subscriptionId: subId }) });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.status === 'active') {
            setMessage({ tone: 'ok', text: `Hvala! Paket ${json.plan === 'pro' ? 'Pro' : 'Starter'} je aktivan.` });
            await refresh();
          } else if (res.ok) {
            setMessage({ tone: 'ok', text: 'Uplata je primljena i čeka potvrdu PayPala. Paket će se uključiti za par minuta.' });
          } else {
            setMessage({ tone: 'err', text: json.error || 'Uplatu nije moguće potvrditi.' });
          }
        }
        setBusy('');
        window.history.replaceState(null, '', '/dashboard/paket');
      }
      await load();
    })();
  }, [load, refresh]);

  const subscribe = async (plan: 'starter' | 'pro') => {
    setMessage(null);
    setBusy(plan);
    const headers = await authHeaders();
    if (!headers) return setBusy('');
    const res = await fetch('/api/billing/paypal/subscribe', { method: 'POST', headers, body: JSON.stringify({ plan }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) {
      window.location.href = json.url;
      return;
    }
    setMessage({ tone: 'err', text: json.error || 'Plaćanje trenutno nije dostupno.' });
    setBusy('');
  };

  const cancel = async () => {
    if (!window.confirm('Otkazati pretplatu? Paket vrijedi do kraja plaćenog perioda.')) return;
    setBusy('cancel');
    const headers = await authHeaders();
    if (headers) {
      const res = await fetch('/api/billing/paypal/cancel', { method: 'POST', headers });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? { tone: 'ok', text: 'Pretplata je otkazana. Nema novih naplata.' } : { tone: 'err', text: json.error || 'Otkazivanje nije uspjelo.' });
      await load();
    }
    setBusy('');
  };

  const active = status?.billingStatus === 'active';
  const inTrial = status?.trialEnds ? Date.parse(status.trialEnds) > Date.now() : false;

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Paket i plaćanje</h2>
        <p className="mt-1 text-sm text-slate-400">Izaberite paket i plaćajte mjesečno preko PayPala. Otkazivanje u bilo kojem trenutku.</p>
      </div>

      {status?.paypal.sandbox && status.paypal.enabled && (
        <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-200">
          Probni način (PayPal Sandbox): plaćanja nisu stvarna i ne naplaćuje se pravi novac.
        </p>
      )}

      {message && (
        <p role="status" className={`rounded-lg border p-3 text-sm ${message.tone === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
          {message.text}
        </p>
      )}

      <section className={panel}>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Trenutno</p>
        {!status ? (
          <div className="mt-3 h-12 animate-pulse rounded-lg bg-white/5" />
        ) : (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-white">
                {status.plan === 'pro' ? 'Pro' : 'Starter'}
                {status.billingStatus && <span className="ml-3 align-middle text-sm font-medium text-slate-300">· Pretplata: {STATUS_TEXT[status.billingStatus] || status.billingStatus}</span>}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {active && status.planUntil
                  ? `Sljedeća naplata oko ${fmt(status.planUntil)}.`
                  : status.billingStatus === 'cancelled' && status.planUntil
                    ? `Paket vrijedi do ${fmt(status.planUntil)}.`
                    : inTrial
                      ? `Besplatni period do ${fmt(status.trialEnds)}. Ako se pretplatite sada, prva naplata je tek tada.`
                      : 'Nemate aktivnu pretplatu.'}
              </p>
            </div>
            {status.billingStatus === 'pending' && (
              <button
                type="button"
                disabled={busy !== ''}
                onClick={async () => {
                  setBusy('confirm');
                  const headers = await authHeaders();
                  if (headers) {
                    const res = await fetch('/api/billing/paypal/confirm', { method: 'POST', headers, body: '{}' });
                    const json = await res.json().catch(() => ({}));
                    if (res.ok && json.status === 'active') {
                      setMessage({ tone: 'ok', text: `Hvala! Paket ${json.plan === 'pro' ? 'Pro' : 'Starter'} je aktivan.` });
                      await refresh();
                    } else if (res.ok) {
                      setMessage({ tone: 'err', text: 'PayPal još nije potvrdio uplatu. Ako ste je završili, pokušajte za minut.' });
                    } else setMessage({ tone: 'err', text: json.error || 'Uplatu nije moguće provjeriti.' });
                    await load();
                  }
                  setBusy('');
                }}
                className="min-h-10 rounded-lg bg-blue-500 px-4 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
              >
                {busy === 'confirm' ? 'Provjeravam...' : 'Provjeri uplatu'}
              </button>
            )}
            {status.hasSubscription && active && (
              <button type="button" onClick={cancel} disabled={busy !== ''} className="min-h-10 rounded-lg border border-white/10 px-4 text-xs font-semibold text-slate-300 transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-50">
                {busy === 'cancel' ? 'Otkazujem...' : 'Otkaži pretplatu'}
              </button>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((p) => {
          const current = active && status?.plan === p.id;
          return (
            <section key={p.id} className={`${panel} flex flex-col ${p.id === 'pro' ? 'border-blue-500/40' : ''}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                {current && <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Vaš paket</span>}
              </div>
              <p className="mt-3 font-display text-4xl font-bold tabular-nums text-white">
                {p.km} KM<span className="ml-1 font-sans text-sm font-medium text-slate-400">/mjesečno</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Naplaćuje se {p.eur} mjesečno preko PayPala.</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!status?.paypal.enabled || busy !== '' || current}
                onClick={() => subscribe(p.id)}
                className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] bg-[#ffc439] px-4 text-sm font-bold text-[#111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === p.id ? 'Otvaram PayPal...' : current ? 'Aktivan' : `Plati PayPalom`}
              </button>
            </section>
          );
        })}
      </div>

      {status && !status.paypal.enabled && (
        <p className="text-xs text-slate-500">Online plaćanje još nije uključeno. Za aktivaciju paketa nas kontaktirajte.</p>
      )}
      <p className="text-[11px] leading-relaxed text-slate-500">
        Plaćanjem prihvatate <a className="text-blue-400 hover:text-blue-300" href="/uslovi">uslove korištenja</a> i{' '}
        <a className="text-blue-400 hover:text-blue-300" href="/povrat-novca">pravila povrata novca</a>.
      </p>
    </div>
  );
}
