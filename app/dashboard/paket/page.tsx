'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useBusiness } from '../_lib/business-context';
import Icon from '../_components/icons';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

type Plan = 'starter' | 'pro';
type Bank = { recipient?: string; address?: string; account?: string; bank?: string; iban?: string; swift?: string; reference: string };
type Status = {
  plan: Plan;
  planUntil: string | null;
  billingStatus: string | null;
  billingProvider: string | null;
  hasSubscription: boolean;
  portalUrl: string | null;
  provider: 'dodo' | 'lemonsqueezy' | 'paypal' | null;
  testMode: boolean;
  trialEnds: string | null;
  trialDaysLeft: number;
  requiresPayment: boolean;
  bank: Bank | null;
  paypal: { enabled: boolean; sandbox: boolean };
};

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    km: 15,
    features: ['Online zakazivanje i stranica firme', 'Obavijesti i podsjetnici', 'Panel za termine i upite', 'Usluge i radno vrijeme sami postavite u prvih 30 dana'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    km: 50,
    features: ['Sve iz Startera', 'Sami mijenjate usluge, cijene i radno vrijeme', 'Zaključani dani i godišnji odmor', 'Recenzije, povratak klijenata, QR poster'],
  },
];

const MONTHS = ['januara', 'februara', 'marta', 'aprila', 'maja', 'juna', 'jula', 'augusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
// Ručno, jer neki preglednici nemaju bosanski format datuma.
const fmt = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const STATUS_TEXT: Record<string, string> = {
  active: 'Aktivna',
  pending: 'Čeka potvrdu',
  bank_pending: 'Čeka uplatu',
  cancelled: 'Otkazana',
  suspended: 'Zaustavljena (neuspjela naplata)',
  expired: 'Istekla',
};
const planName = (p: string | null | undefined) => (p === 'pro' ? 'Pro' : 'Starter');

const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';
const ghostBtn = 'min-h-10 rounded-lg border border-white/10 px-4 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white disabled:opacity-50';

function CopyRow({ label, value }: { label: string; value?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
        <p className="break-words text-sm font-medium text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white"
        aria-label={`Kopiraj: ${label}`}
      >
        <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BillingPage() {
  const { refresh } = useBusiness();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [welcome, setWelcome] = useState(false);

  const authHeaders = async (): Promise<Record<string, string> | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : null;
  };

  const load = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers) return null;
    const res = await fetch('/api/billing/status', { headers, cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as Status;
    setStatus(json);
    return json;
  }, []);

  const post = async (url: string, body: unknown = {}) => {
    const headers = await authHeaders();
    if (!headers) return { ok: false, json: { error: 'Prijavite se ponovo.' } as Record<string, unknown> };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    return { ok: res.ok, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const back = params.get('placanje');
    if (params.get('prvi') === '1') setWelcome(true);
    (async () => {
      if (back) window.history.replaceState(null, '', '/dashboard/paket');
      if (back === 'odustao') setMessage({ tone: 'err', text: 'Plaćanje je prekinuto. Ništa nije naplaćeno.' });
      if (back === 'povratak') {
        // Potvrda stiže od Dodoa za par sekundi.
        setMessage({ tone: 'ok', text: 'Hvala! Provjeravam pretplatu...' });
        for (let i = 0; i < 10; i += 1) {
          const s = await load();
          if (s && s.hasSubscription && (s.billingStatus === 'active' || s.billingStatus === 'pending')) {
            setWelcome(false);
            setMessage({ tone: 'ok', text: `Hvala! Paket ${planName(s.plan)} je aktivan.` });
            await refresh();
            return;
          }
          await new Promise((r) => setTimeout(r, 2500));
        }
        setMessage({ tone: 'ok', text: 'Kartica je primljena. Ako paket još ne piše kao aktivan, kliknite „Provjeri pretplatu” za minut.' });
        return;
      }
      await load();
    })();
  }, [load, refresh]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setMessage(null);
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy('');
    }
  };

  const payCard = (plan: Plan) =>
    run(plan, async () => {
      const url = status?.provider === 'dodo'
        ? '/api/billing/dodo/checkout'
        : status?.provider === 'lemonsqueezy' ? '/api/billing/lemonsqueezy/checkout' : '/api/billing/paypal/subscribe';
      const { ok, json } = await post(url, { plan });
      if (ok && typeof json.url === 'string') {
        window.location.href = json.url;
        await new Promise(() => {}); // ostaje „Otvaram...” dok se stranica ne promijeni
      }
      setMessage({ tone: 'err', text: String(json.error || 'Plaćanje trenutno nije dostupno.') });
    });

  const payBank = (plan: Plan) =>
    run(`bank-${plan}`, async () => {
      const { ok, json } = await post('/api/billing/bank', { plan });
      if (!ok) return setMessage({ tone: 'err', text: String(json.error || 'Izbor nije sačuvan.') });
      setWelcome(false);
      setMessage({ tone: 'ok', text: 'Izabrali ste uplatnicu. Podaci za uplatu su ispod.' });
      await load();
      await refresh();
      setTimeout(() => document.getElementById('uplatnica')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    });

  const changePlan = (plan: Plan) =>
    run(`change-${plan}`, async () => {
      if (!window.confirm(`Promijeniti paket na ${planName(plan)}? Razlika se obračunava odmah, srazmjerno danima.`)) return;
      const { ok, json } = await post('/api/billing/dodo/change', { plan });
      if (!ok) return setMessage({ tone: 'err', text: String(json.error || 'Promjena nije uspjela.') });
      setMessage({ tone: 'ok', text: `Paket je promijenjen na ${planName(plan)}.` });
      await load();
      await refresh();
    });

  const openPortal = () =>
    run('portal', async () => {
      if (status?.billingProvider === 'lemonsqueezy') {
        if (status.portalUrl) window.open(status.portalUrl, '_blank', 'noopener');
        return;
      }
      const { ok, json } = await post('/api/billing/dodo/portal');
      if (ok && typeof json.url === 'string') window.open(json.url, '_blank', 'noopener');
      else setMessage({ tone: 'err', text: String(json.error || 'Upravljanje pretplatom trenutno nije dostupno.') });
    });

  const check = () =>
    run('check', async () => {
      const { ok, json } = await post('/api/billing/dodo/refresh');
      const s = await load();
      if (!ok) return setMessage({ tone: 'err', text: String(json.error || 'Provjera trenutno nije moguća.') });
      if (s?.billingStatus === 'active') {
        setMessage({ tone: 'ok', text: `Paket ${planName(s.plan)} je aktivan.` });
        await refresh();
      } else setMessage({ tone: 'err', text: 'Pretplata još nije potvrđena. Ako ste unijeli karticu, pokušajte za minut.' });
    });

  const s = status;
  const provider = s?.billingProvider || null;
  const active = s?.billingStatus === 'active';
  const dodoSub = provider === 'dodo' && !!s?.hasSubscription;
  const dodoLive = dodoSub && (active || s?.billingStatus === 'pending');
  const lemonSub = provider === 'lemonsqueezy' && !!s?.hasSubscription;
  const onBank = provider === 'bank';
  const free = provider === 'free';
  const cardEnabled = s?.provider === 'dodo' || s?.provider === 'lemonsqueezy' || !!s?.paypal.enabled;
  const bankEnabled = !!s?.bank;
  const dodo = s?.provider === 'dodo';

  let summary = 'Nemate aktivnu pretplatu.';
  if (s) {
    if (free) summary = 'Trajno besplatan pristup. Ništa ne plaćate.';
    else if (dodoSub && active && s.planUntil) summary = s.trialDaysLeft > 0 ? `Besplatni period traje još ${s.trialDaysLeft} ${s.trialDaysLeft === 1 ? 'dan' : 'dana'}. Prva naplata oko ${fmt(s.planUntil)}.` : `Sljedeća naplata oko ${fmt(s.planUntil)}.`;
    else if (s.billingStatus === 'cancelled' && s.planUntil) summary = `Pretplata je otkazana. Paket vrijedi do ${fmt(s.planUntil)}.`;
    else if (onBank && active && s.planUntil) summary = `Plaćeno uplatnicom do ${fmt(s.planUntil)}.`;
    else if (onBank) summary = `Plaćanje uplatnicom. ${s.planUntil ? `Paket vrijedi do ${fmt(s.planUntil)}, a uplata se potvrđuje kad stigne na račun.` : 'Uplata se potvrđuje kad stigne na račun.'}`;
    else if (active && s.planUntil) summary = `Sljedeća naplata oko ${fmt(s.planUntil)}.`;
    else if (s.billingStatus === 'suspended') summary = 'Naplata nije uspjela. Ažurirajte karticu preko „Upravljaj pretplatom”.';
    else if (s.trialDaysLeft > 0 && !s.requiresPayment) summary = `Besplatni period traje još ${s.trialDaysLeft} ${s.trialDaysLeft === 1 ? 'dan' : 'dana'}.`;
    else if (s.requiresPayment) summary = 'Izaberite paket da biste nastavili. Prvih 30 dana je besplatno.';
  }

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Paket i plaćanje</h2>
        <p className="store-only mt-1 text-sm text-slate-400">
          Ovdje vidite koji paket imate i do kada vrijedi. Promjene paketa i plaćanje nisu dostupni u aplikaciji.
        </p>
        <p className="store-hidden mt-1 text-sm text-slate-400">
          {dodo
            ? 'Prvih 30 dana besplatno. Plaćate mjesečno karticom, Apple Payom ili Google Payom, ili uplatnicom. Otkazivanje u bilo kojem trenutku.'
            : 'Izaberite paket i plaćajte mjesečno. Otkazivanje u bilo kojem trenutku.'}
        </p>
      </div>

      {welcome && s?.requiresPayment && (
        <div className="store-hidden">
        <section className="rounded-[var(--po-radius)] border border-blue-500/30 bg-blue-500/10 p-[var(--po-pad)]">
          <p className="font-display text-lg font-bold text-white">Dobrodošli u POSLO ONE! 👋</p>
          <p className="mt-1 text-sm text-blue-100/90">
            Još jedan korak: izaberite paket. <b>Prvih 30 dana je besplatno</b>. Kartica se samo provjerava, a prva naplata je tek nakon 30 dana. Ako vam više odgovara, možete plaćati i uplatnicom.
          </p>
        </section>
        </div>
      )}

      {s?.testMode && dodo && (
        <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-200">
          Probni način: plaćanja nisu stvarna i ne naplaćuje se pravi novac. Za probu koristite testnu karticu 4242 4242 4242 4242.
        </p>
      )}

      {message && (
        <p role="status" className={`rounded-lg border p-3 text-sm ${message.tone === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
          {message.text}
        </p>
      )}

      <section className={panel}>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Trenutno</p>
        {!s ? (
          <div className="mt-3 h-12 animate-pulse rounded-lg bg-white/5" />
        ) : (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-2xl font-bold text-white">
                {planName(s.plan)}
                {s.billingStatus && !free && (
                  <span className="ml-3 align-middle text-sm font-medium text-slate-300">
                    · {onBank ? 'Uplatnica' : 'Pretplata'}: {STATUS_TEXT[s.billingStatus] || s.billingStatus}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-slate-400">{summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {provider === 'dodo' && !active && (
                <button type="button" onClick={check} disabled={busy !== ''} className="store-hidden min-h-10 rounded-lg bg-blue-500 px-4 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50">
                  {busy === 'check' ? 'Provjeravam...' : 'Provjeri pretplatu'}
                </button>
              )}
              {(dodoSub || lemonSub) && (
                <button type="button" onClick={openPortal} disabled={busy !== ''} className={`store-hidden ${ghostBtn}`}>
                  {busy === 'portal' ? 'Otvaram...' : 'Upravljaj pretplatom / kartica / otkaži'}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {!free && <div className="store-hidden grid grid-cols-1 gap-4 md:grid-cols-2">
        {PLANS.map((p) => {
          const current = s?.plan === p.id && (active || dodoLive || onBank);
          const canSwitch = dodoLive && !current;
          return (
            <section key={p.id} className={`${panel} flex flex-col ${p.id === 'pro' ? 'border-blue-500/40' : ''}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                {current && <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Vaš paket</span>}
              </div>
              <p className="mt-3 font-display text-4xl font-bold tabular-nums text-white">
                {p.km} KM<span className="ml-1 font-sans text-sm font-medium text-slate-400">/mjesečno</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {dodo ? 'Kartica (Visa, Mastercard), Apple Pay, Google Pay ili uplatnica.' : 'Plaćanje karticom.'}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>

              {current ? (
                <p className="mt-6 flex min-h-12 items-center justify-center rounded-[calc(var(--po-radius)*0.7)] border border-emerald-500/30 text-sm font-semibold text-emerald-300">Aktivan</p>
              ) : canSwitch ? (
                <button type="button" disabled={busy !== ''} onClick={() => changePlan(p.id)} className="mt-6 flex min-h-12 items-center justify-center rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 text-sm font-bold text-white transition hover:bg-blue-400 disabled:opacity-50">
                  {busy === `change-${p.id}` ? 'Mijenjam...' : `Promijeni na ${p.name}`}
                </button>
              ) : lemonSub && active ? (
                <p className="mt-6 text-center text-xs text-slate-500">Paket mijenjate preko „Upravljaj pretplatom”.</p>
              ) : (
                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    disabled={!cardEnabled || busy !== ''}
                    onClick={() => payCard(p.id)}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon name="wallet" className="h-4 w-4" />
                    {busy === p.id ? 'Otvaram plaćanje...' : dodo && s && s.trialDaysLeft > 0 ? `Plati karticom · ${s.trialDaysLeft} ${s.trialDaysLeft === 1 ? 'dan' : 'dana'} besplatno` : 'Plati karticom'}
                  </button>
                  {bankEnabled && !onBank && (
                    <button type="button" disabled={busy !== ''} onClick={() => payBank(p.id)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] border border-white/10 px-4 text-sm font-semibold text-slate-200 transition hover:border-white/25 disabled:opacity-50">
                      <Icon name="banknote" className="h-4 w-4" />
                      {busy === `bank-${p.id}` ? 'Spremam...' : 'Plati uplatnicom'}
                    </button>
                  )}
                  {onBank && (
                    <button type="button" disabled={busy !== ''} onClick={() => payBank(p.id)} className="flex min-h-11 w-full items-center justify-center rounded-[calc(var(--po-radius)*0.7)] border border-white/10 px-4 text-xs font-semibold text-slate-300 transition hover:border-white/25 disabled:opacity-50">
                      {busy === `bank-${p.id}` ? 'Spremam...' : `Uplatnicom pređi na ${p.name}`}
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>}

      {onBank && s?.bank && (
        <section id="uplatnica" className={`store-hidden ${panel}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <Icon name="banknote" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">Podaci za uplatnicu</h3>
              <p className="text-xs text-slate-400">Uplatite mjesečno ili unaprijed za više mjeseci. Paket se produžava kad uplata stigne.</p>
            </div>
          </div>
          <div className="mt-4">
            <CopyRow label="Primalac" value={s.bank.recipient} />
            <CopyRow label="Adresa primaoca" value={s.bank.address} />
            <CopyRow label="Broj računa" value={s.bank.account} />
            <CopyRow label="Banka" value={s.bank.bank} />
            <CopyRow label="IBAN" value={s.bank.iban} />
            <CopyRow label="SWIFT" value={s.bank.swift} />
            <CopyRow label="Iznos" value={`${s.plan === 'pro' ? '50,00' : '15,00'} KM`} />
            <CopyRow label="Svrha uplate" value={`POSLO ONE ${planName(s.plan)} pretplata`} />
            <CopyRow label="Poziv na broj" value={s.bank.reference} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Obavezno upišite poziv na broj, da uplatu povežemo s vašom firmom.</p>
        </section>
      )}

      {s && !cardEnabled && !bankEnabled && (
        <p className="text-xs text-slate-500">Online plaćanje još nije uključeno. Za aktivaciju paketa nas kontaktirajte.</p>
      )}
      <p className="store-hidden text-[11px] leading-relaxed text-slate-500">
        Plaćanjem prihvatate <a className="text-blue-400 hover:text-blue-300" href="/uslovi">uslove korištenja</a> i{' '}
        <a className="text-blue-400 hover:text-blue-300" href="/povrat-novca">pravila povrata novca</a>.
      </p>
    </div>
  );
}
