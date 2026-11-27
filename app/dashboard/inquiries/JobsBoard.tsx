'use client';

import { useMemo, useState } from 'react';
import {
  JOB_STAGES,
  NEXT_STAGE,
  STAGE_LABEL,
  num,
  owedOf,
  profitOf,
  stageOf,
  summarizeJobs,
  type JobStage,
} from '../../../utils/jobs';

export type Job = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  status: 'new' | 'handled';
  created_at: string;
  stage: JobStage | null;
  quote: number | string | null;
  deposit: number | string | null;
  paid: number | string | null;
  costs: number | string | null;
  note: string | null;
  started_on: string | null;
  finished_on: string | null;
  source: 'web' | 'manual' | null;
  review_sent_at: string | null;
};

type Api = (url: string, init?: { method?: string; body?: unknown }) => Promise<Record<string, unknown>>;

const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';
const input =
  'w-full min-h-11 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none';
const btn = 'min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50';

const km = (n: number) => `${n.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;
const money = (v: unknown) => (v === null || v === undefined || v === '' ? '' : String(v));
const day = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('bs-BA') : '');

const STAGE_TONE: Record<JobStage, string> = {
  new: 'bg-blue-500/20 text-blue-300',
  contacted: 'bg-sky-500/15 text-sky-300',
  offer: 'bg-violet-500/20 text-violet-300',
  agreed: 'bg-amber-500/20 text-amber-300',
  done: 'bg-emerald-500/20 text-emerald-300',
  lost: 'bg-white/10 text-gray-400',
};

const NEXT_LABEL: Partial<Record<JobStage, string>> = {
  new: 'Javio sam se',
  contacted: 'Poslao sam ponudu',
  offer: 'Dogovoreno',
  agreed: 'Posao završen',
};

type Form = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  stage: JobStage;
  quote: string;
  deposit: string;
  paid: string;
  costs: string;
  started_on: string;
  finished_on: string;
  note: string;
  manual: boolean;
};

const emptyForm: Form = {
  name: '', phone: '', email: '', service: '', message: '', stage: 'agreed',
  quote: '', deposit: '', paid: '', costs: '', started_on: '', finished_on: '', note: '', manual: true,
};

const FILTERS = [
  { key: 'active', label: 'U toku' },
  { key: 'done', label: 'Završeni' },
  { key: 'lost', label: 'Odbijeni' },
  { key: 'all', label: 'Svi' },
] as const;

export default function JobsBoard({
  items,
  setItems,
  api,
  highlight,
  hasReviewLink,
}: {
  items: Job[];
  setItems: (fn: (cur: Job[]) => Job[]) => void;
  api: Api;
  highlight: string | null;
  hasReviewLink: boolean;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('active');
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [askReview, setAskReview] = useState<Job | null>(null);

  const sum = useMemo(() => summarizeJobs(items), [items]);
  const shown = items.filter((j) => {
    const s = stageOf(j);
    if (filter === 'all') return true;
    if (filter === 'done') return s === 'done';
    if (filter === 'lost') return s === 'lost';
    return s !== 'done' && s !== 'lost';
  });

  const replace = (job: Job) => setItems((cur) => (cur.some((j) => j.id === job.id) ? cur.map((j) => (j.id === job.id ? job : j)) : [job, ...cur]));

  const maybeAskReview = (job: Job) => {
    if (stageOf(job) === 'done' && job.email && !job.review_sent_at && hasReviewLink) setAskReview(job);
  };

  const move = async (job: Job, stage: JobStage) => {
    // Završetak traži iznos: otvara se forma s već izabranom fazom "Završeno".
    if (stage === 'done') {
      openEdit(job, 'done');
      return;
    }
    setBusy(job.id);
    setError('');
    try {
      const res = await api('/api/dashboard/inquiries', { method: 'PATCH', body: { id: job.id, stage } });
      replace(res.inquiry as Job);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const openEdit = (job: Job, stage?: JobStage) =>
    setForm({
      id: job.id,
      name: job.name,
      phone: job.phone,
      email: job.email || '',
      service: job.service || '',
      message: job.message,
      stage: stage || stageOf(job),
      quote: money(job.quote),
      deposit: money(job.deposit),
      paid: stage === 'done' && job.paid == null ? money(job.quote) : money(job.paid),
      costs: money(job.costs),
      started_on: job.started_on || '',
      finished_on: job.finished_on || (stage === 'done' ? new Date().toISOString().slice(0, 10) : ''),
      note: job.note || '',
      manual: job.source === 'manual',
    });

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      setError('Upišite ime klijenta.');
      return;
    }
    setBusy('form');
    setError('');
    const amounts = {
      stage: form.stage,
      quote: form.quote,
      deposit: form.deposit,
      paid: form.paid,
      costs: form.costs,
      started_on: form.started_on || null,
      finished_on: form.finished_on || null,
      note: form.note,
    };
    try {
      const res = form.id
        ? await api('/api/dashboard/inquiries', { method: 'PATCH', body: { id: form.id, ...amounts } })
        : await api('/api/dashboard/inquiries', {
            method: 'POST',
            body: { ...amounts, name: form.name, phone: form.phone, email: form.email, service: form.service, message: form.message },
          });
      const job = res.inquiry as Job;
      replace(job);
      setForm(null);
      setNotice(form.id ? 'Posao je sačuvan.' : 'Posao je dodan.');
      maybeAskReview(job);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    if (!form?.id) return;
    setBusy('form');
    try {
      await api(`/api/dashboard/inquiries?id=${form.id}`, { method: 'DELETE' });
      setItems((cur) => cur.filter((j) => j.id !== form.id));
      setForm(null);
      setNotice('Posao je obrisan.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const sendReview = async (job: Job) => {
    setBusy('review');
    setError('');
    try {
      const res = await api('/api/dashboard/inquiries', { method: 'POST', body: { action: 'review', id: job.id } });
      if (res.inquiry) replace(res.inquiry as Job);
      setNotice(`Zahvala i molba za recenziju su poslane na ${job.email}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
      setAskReview(null);
    }
  };

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));
  const formProfit = form ? num(form.paid) - num(form.costs) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Poslovi</h1>
          <p className="mt-1 text-sm text-gray-400">Upiti, ponude i zarada po poslu na jednom mjestu.</p>
        </div>
        <button type="button" className={`${btn} bg-blue-600 text-white hover:bg-blue-500`} onClick={() => { setError(''); setForm({ ...emptyForm }); }}>
          + Dodaj posao
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={panel}>
          <p className="text-xs text-gray-400">Čista zarada ovaj mjesec</p>
          <p className={`mt-1 text-xl font-bold ${sum.monthProfit < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{km(sum.monthProfit)}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">Naplaćeno {km(sum.monthRevenue)} · {sum.monthDone} {sum.monthDone === 1 ? 'posao' : 'poslova'}</p>
        </div>
        <div className={panel}>
          <p className="text-xs text-gray-400">Ove godine</p>
          <p className="mt-1 text-xl font-bold text-white">{km(sum.yearProfit)}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">{sum.yearDone} završenih · prosjek {km(sum.avgPerJob)}</p>
        </div>
        <div className={panel}>
          <p className="text-xs text-gray-400">Klijenti još duguju</p>
          <p className={`mt-1 text-xl font-bold ${sum.owed > 0 ? 'text-amber-300' : 'text-white'}`}>{km(sum.owed)}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">Dogovoreni poslovi, ponuda minus avans</p>
        </div>
        <div className={panel}>
          <p className="text-xs text-gray-400">Upiti pretvoreni u posao</p>
          <p className="mt-1 text-xl font-bold text-white">{sum.won} od {sum.total}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">{sum.open} u toku</p>
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-300'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={`${panel} text-sm text-gray-400`}>
          {filter === 'active' ? 'Nema poslova u toku. Novi upiti s vašeg profila pojavit će se ovdje, a posao dogovoren telefonom dodajte dugmetom „+ Dodaj posao”.' : 'Ovdje još nema poslova.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((job) => {
            const s = stageOf(job);
            const next = NEXT_STAGE[s];
            const owed = owedOf(job);
            return (
              <li key={job.id} id={`inquiry-${job.id}`} className={`${panel} ${highlight === job.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-white">{job.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleDateString('bs-BA')}
                      {job.service ? ` · ${job.service}` : ''}
                      {job.source === 'manual' ? ' · dodano ručno' : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_TONE[s]}`}>{STAGE_LABEL[s]}</span>
                </div>
                {job.message && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-200">{job.message}</p>}

                {(job.quote != null || job.deposit != null || job.paid != null || job.costs != null) && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-gray-300">
                    {job.quote != null && <span>Ponuda <b className="text-white">{km(num(job.quote))}</b></span>}
                    {job.deposit != null && <span>Avans <b className="text-white">{km(num(job.deposit))}</b></span>}
                    {s === 'agreed' && owed > 0 && <span className="text-amber-300">Duguje <b>{km(owed)}</b></span>}
                    {job.paid != null && <span>Naplaćeno <b className="text-white">{km(num(job.paid))}</b></span>}
                    {job.costs != null && <span>Troškovi <b className="text-white">{km(num(job.costs))}</b></span>}
                    {s === 'done' && job.paid != null && <span className="text-emerald-300">Zarada <b>{km(profitOf(job))}</b></span>}
                    {(job.started_on || job.finished_on) && (
                      <span className="text-gray-400">{[day(job.started_on), day(job.finished_on)].filter(Boolean).join(' – ')}</span>
                    )}
                  </div>
                )}
                {job.note && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-400">📝 {job.note}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {next && (
                    <button type="button" disabled={busy === job.id} onClick={() => move(job, next)} className={`${btn} bg-blue-600 text-white`}>
                      {NEXT_LABEL[s]} →
                    </button>
                  )}
                  {job.phone && (
                    <a href={`tel:${job.phone.replace(/[^\d+]/g, '')}`} className={`${btn} border border-white/10 text-white`}>
                      Nazovi
                    </a>
                  )}
                  {job.email && (
                    <a href={`mailto:${job.email}`} className={`${btn} border border-white/10 text-white`}>
                      E-mail
                    </a>
                  )}
                  <button type="button" onClick={() => openEdit(job)} className={`${btn} bg-white/10 text-white`}>
                    Uredi
                  </button>
                  {s !== 'lost' && s !== 'done' && (
                    <button type="button" disabled={busy === job.id} onClick={() => move(job, 'lost')} className={`${btn} text-gray-400 hover:text-white`}>
                      Odbijeno
                    </button>
                  )}
                  {s === 'done' && job.email && !job.review_sent_at && hasReviewLink && (
                    <button type="button" onClick={() => setAskReview(job)} className={`${btn} border border-white/10 text-white`}>
                      Zatraži recenziju
                    </button>
                  )}
                  {job.review_sent_at && <span className="self-center text-xs text-gray-500">Molba za recenziju poslana</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Posao">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => busy !== 'form' && setForm(null)} />
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">{form.id ? form.name : 'Novi posao'}</h2>
              <button type="button" aria-label="Zatvori" onClick={() => setForm(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {!form.id && (
                <>
                  <input className={input} placeholder="Ime klijenta *" value={form.name} onChange={set('name')} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={input} placeholder="Telefon" inputMode="tel" value={form.phone} onChange={set('phone')} />
                    <input className={input} placeholder="E-mail" inputMode="email" value={form.email} onChange={set('email')} />
                  </div>
                  <input className={input} placeholder="Šta se radi (npr. iskop temelja)" value={form.service} onChange={set('service')} />
                </>
              )}
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">Faza</span>
                <select className={input} value={form.stage} onChange={set('stage')}>
                  {JOB_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">Ponuda (KM)</span>
                  <input className={input} inputMode="decimal" placeholder="0" value={form.quote} onChange={set('quote')} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">Avans (KM)</span>
                  <input className={input} inputMode="decimal" placeholder="nije uzet" value={form.deposit} onChange={set('deposit')} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">Naplaćeno ukupno (KM)</span>
                  <input className={input} inputMode="decimal" placeholder="kad završi" value={form.paid} onChange={set('paid')} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">Troškovi (KM)</span>
                  <input className={input} inputMode="decimal" placeholder="materijal, radnici" value={form.costs} onChange={set('costs')} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">Početak radova</span>
                  <input type="date" className={input} value={form.started_on} onChange={set('started_on')} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">Završetak</span>
                  <input type="date" className={input} value={form.finished_on} onChange={set('finished_on')} />
                </label>
              </div>
              {form.paid && (
                <p className={`text-sm font-semibold ${formProfit < 0 ? 'text-red-300' : 'text-emerald-300'}`}>Čista zarada: {km(formProfit)}</p>
              )}
              <textarea className={`${input} min-h-20`} placeholder="Bilješka (samo vi je vidite)" value={form.note} onChange={set('note')} />
              <div className="flex flex-wrap justify-between gap-2 pt-1">
                {form.id && form.manual ? (
                  <button type="button" disabled={busy === 'form'} onClick={remove} className={`${btn} text-red-300`}>
                    Obriši posao
                  </button>
                ) : <span />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(null)} className={`${btn} bg-white/10 text-white`}>Odustani</button>
                  <button type="button" disabled={busy === 'form'} onClick={save} className={`${btn} bg-blue-600 text-white`}>
                    {busy === 'form' ? 'Spremam…' : 'Sačuvaj'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {askReview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Molba za recenziju">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => busy !== 'review' && setAskReview(null)} />
          <div className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
            <h2 className="text-lg font-bold text-white">Poslati zahvalu klijentu?</h2>
            <p className="mt-2 text-sm text-gray-300">
              {askReview.name} dobija e-mail na {askReview.email} sa zahvalom i molbom za Google recenziju. Šalje se samo jednom.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={busy === 'review'} onClick={() => setAskReview(null)} className={`${btn} bg-white/10 text-white`}>Ne</button>
              <button type="button" disabled={busy === 'review'} onClick={() => sendReview(askReview)} className={`${btn} bg-blue-600 text-white`}>
                {busy === 'review' ? 'Šaljem…' : 'Da, pošalji'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
