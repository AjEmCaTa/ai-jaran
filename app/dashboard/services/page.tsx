'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import Icon from '../_components/icons';
import { useBusiness } from '../_lib/business-context';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Service = { id: string; name: string; description: string | null; duration: string | null; price: number | null };
type Draft = { id: string; name: string; description: string; duration: string; price: string };

const EMPTY: Draft = { id: '', name: '', description: '', duration: '', price: '' };
const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';
const input =
  'mt-2 w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Prijavite se ponovo.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
}

export default function ServicesPage() {
  const { business } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/services', { headers: await authHeaders(), cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Usluge nije moguće učitati.');
      setServices(Array.isArray(result.services) ? result.services : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Usluge nije moguće učitati.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || saving) return;
    setError('');
    setMessage('');
    const price = Number(draft.price.replace(',', '.'));
    if (!draft.name.trim()) return setError('Unesite naziv usluge.');
    if (!Number.isFinite(price) || price < 0) return setError('Unesite ispravnu cijenu.');
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/services', {
        method: draft.id ? 'PATCH' : 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name.trim(),
          description: draft.description.trim(),
          duration: draft.duration.trim() || null,
          price,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Uslugu nije moguće sačuvati.');
      setMessage('Usluga je sačuvana.');
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uslugu nije moguće sačuvati.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (service: Service) => {
    if (!window.confirm(`Obrisati uslugu "${service.name}"?`)) return;
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/dashboard/services', {
        method: 'DELETE',
        headers: await authHeaders(),
        body: JSON.stringify({ id: service.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Uslugu nije moguće obrisati.');
      setMessage('Usluga je obrisana.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uslugu nije moguće obrisati.');
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Usluge i cijene</h2>
          <p className="mt-1 text-sm text-slate-400">
            Usluge se prikazuju na javnom profilu{business.slug ? ` /katalog/${business.slug}` : ''}.
          </p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setMessage('');
              setDraft(EMPTY);
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            <Icon name="plus" className="h-4 w-4" />
            Dodaj uslugu
          </button>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

      {draft && (
        <form onSubmit={save} className={`${panel} grid gap-4 sm:grid-cols-2`}>
          <label className="block text-xs font-medium text-slate-300 sm:col-span-2">
            Naziv usluge
            <input className={input} maxLength={150} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="block text-xs font-medium text-slate-300 sm:col-span-2">
            Opis
            <textarea className={input} rows={3} maxLength={1000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </label>
          <label className="block text-xs font-medium text-slate-300">
            Cijena (KM)
            <input className={input} inputMode="decimal" required value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          </label>
          <label className="block text-xs font-medium text-slate-300">
            Trajanje (npr. 2h ili 90 min)
            <input className={input} maxLength={40} value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50">
              {saving ? 'Čuvanje…' : 'Sačuvaj'}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-[calc(var(--po-radius)*0.7)] border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5">
              Odustani
            </button>
          </div>
        </form>
      )}

      <section className={panel} aria-label="Lista usluga">
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        ) : services.length === 0 ? (
          <p className="text-sm text-slate-400">Još nema usluga. Dodajte prvu uslugu da bi se prikazala klijentima.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {services.map((service) => (
              <li key={service.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="break-words font-semibold text-white">{service.name}</p>
                  {service.description && <p className="mt-1 break-words text-xs text-slate-400">{service.description}</p>}
                  <p className="mt-1 text-xs text-blue-300">
                    {service.price != null ? `${Number(service.price).toLocaleString('bs-BA')} KM` : ''}
                    {service.price != null && service.duration ? ' · ' : ''}
                    {service.duration || ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMessage('');
                      setDraft({
                        id: service.id,
                        name: service.name,
                        description: service.description || '',
                        duration: service.duration || '',
                        price: service.price != null ? String(service.price) : '',
                      });
                    }}
                    className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-200 hover:bg-white/5"
                  >
                    Uredi
                  </button>
                  <button type="button" onClick={() => remove(service)} className="min-h-10 rounded-lg border border-red-500/30 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/10">
                    Obriši
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
