'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Icon from '../_components/icons';
import { fullDate } from '../_lib/dates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Visit = { id: string; date: string; service: string; price: string; status: string };

type Customer = {
  key: string;
  name: string;
  email: string;
  phone: string;
  visits: Visit[];
  completed: number;
  cancelled: number;
  lastReservation: string;
  totalSpent: number;
};

type SortMode = 'last' | 'spent' | 'visits';

function parsePrice(value: unknown) {
  let normalized = String(value ?? '').replace(/[^\d,.-]/g, '');
  if (normalized.includes(',')) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else normalized = normalized.replace(/\.(?=\d{3}$)/, '');
  const result = Number.parseFloat(normalized);
  return Number.isFinite(result) ? result : 0;
}

const normalize = (value: unknown) =>
  String(value || '').toLocaleLowerCase('bs').replace(/đ/g, 'dj').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isCompleted = (value: unknown) => ['zavrseno', 'completed', 'finished'].includes(normalize(value));
const isCancelled = (value: unknown) => ['otkazano', 'cancelled', 'canceled'].includes(normalize(value));

const money = (n: number) => `${n.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;
const formatDate = (value: string) => (value && !Number.isNaN(new Date(value).getTime()) ? fullDate(new Date(value)) : '-');

function waNumber(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `387${digits.slice(1)}`;
  return digits;
}

function tagsOf(customer: Customer) {
  const tags: { label: string; tone: string }[] = [];
  if (customer.visits.length === 1) tags.push({ label: 'Novi', tone: 'border-blue-500/25 bg-blue-500/10 text-blue-300' });
  if (customer.completed >= 3) tags.push({ label: 'Stalni', tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' });
  const last = customer.lastReservation ? new Date(customer.lastReservation).getTime() : 0;
  if (last && Date.now() - last > 60 * 24 * 60 * 60 * 1000) tags.push({ label: 'Neaktivan 60+ dana', tone: 'border-amber-500/25 bg-amber-500/10 text-amber-300' });
  return tags;
}

const inputClass =
  'w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('last');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [draft, setDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Prijavite se ponovo za pregled klijenata.');
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const response = await fetch('/api/dashboard', { headers });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Klijente nije moguće učitati.');

        const grouped = new Map<string, Customer>();
        for (const reservation of result.reservations || []) {
          const email = String(reservation.customer_email || '').trim();
          const phone = String(reservation.customer_phone || '').trim();
          const name = String(reservation.customer_name || 'Klijent').trim();
          const key = reservation.user_id || email.toLocaleLowerCase('bs') || phone || name.toLocaleLowerCase('bs');
          const current: Customer = grouped.get(key) || { key, name, email, phone, visits: [], completed: 0, cancelled: 0, lastReservation: '', totalSpent: 0 };
          const bookedAt = String(reservation.reservation_date || reservation.created_at || '');
          current.visits.push({
            id: String(reservation.id),
            date: bookedAt,
            service: String(reservation.service_name || 'Usluga'),
            price: reservation.price != null && reservation.price !== '' ? (String(reservation.price).includes('KM') ? String(reservation.price) : `${reservation.price} KM`) : '-',
            status: String(reservation.status || 'Aktivno'),
          });
          if (bookedAt > current.lastReservation) current.lastReservation = bookedAt;
          if (isCompleted(reservation.status)) {
            current.completed += 1;
            current.totalSpent += parsePrice(reservation.price);
          }
          if (isCancelled(reservation.status)) current.cancelled += 1;
          if (!current.email && email) current.email = email;
          if (!current.phone && phone) current.phone = phone;
          if (current.name === 'Klijent' && name !== 'Klijent') current.name = name;
          grouped.set(key, current);
        }
        setCustomers([...grouped.values()]);

        // Bilješke nisu kritične: ako tabela još ne postoji, lista klijenata ipak radi
        try {
          const notesResponse = await fetch('/api/dashboard/customer-notes', { headers });
          if (notesResponse.ok) {
            const notesResult = await notesResponse.json();
            setNotes(Object.fromEntries((notesResult.notes || []).map((n: { customer_key: string; note: string }) => [n.customer_key, n.note])));
          }
        } catch {
          /* ignorisi */
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Klijente nije moguće učitati.');
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const visibleCustomers = useMemo(() => {
    const term = normalize(search);
    return customers
      .filter((c) => normalize(`${c.name} ${c.email} ${c.phone}`).includes(term))
      .sort((a, b) =>
        sort === 'spent' ? b.totalSpent - a.totalSpent : sort === 'visits' ? b.visits.length - a.visits.length : b.lastReservation.localeCompare(a.lastReservation),
      );
  }, [customers, search, sort]);

  const returning = customers.filter((c) => c.visits.length >= 2).length;
  const best = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  const selected = customers.find((c) => c.key === selectedKey) || null;

  useEffect(() => {
    setDraft(selectedKey ? notes[selectedKey] || '' : '');
    setNoteMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  useEffect(() => {
    if (!selectedKey) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedKey('');
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedKey]);

  const saveNote = async () => {
    if (!selected) return;
    setSavingNote(true);
    setNoteMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo da biste sačuvali bilješku.');
      const response = await fetch('/api/dashboard/customer-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ customer_key: selected.key, note: draft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Bilješku nije moguće sačuvati.');
      setNotes((current) => ({ ...current, [selected.key]: draft.trim() }));
      setNoteMessage('Bilješka je sačuvana.');
    } catch (err) {
      setNoteMessage(err instanceof Error ? err.message : 'Bilješku nije moguće sačuvati.');
    } finally {
      setSavingNote(false);
    }
  };

  const statusTone = (status: string) =>
    isCancelled(status) ? 'text-red-300' : isCompleted(status) ? 'text-blue-300' : normalize(status) === 'potvrdjeno' ? 'text-emerald-300' : 'text-amber-300';

  return (
    <section className="mx-auto max-w-7xl space-y-5 pb-12 text-gray-100">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Klijenti</h2>
          <p className="mt-1 text-sm text-slate-400">Klijenti koji su rezervisali termin za vaš biznis. Kliknite na klijenta za historiju i bilješke.</p>
        </div>
        <label className="text-xs font-semibold text-slate-400">
          Pretraga
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ime, email ili telefon"
            className={`${inputClass} mt-2 min-h-11 sm:w-72`}
          />
        </label>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">{error}</p>}

      {/* Sažetak */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Ukupno klijenata', value: loading ? '...' : String(customers.length) },
          { label: 'Vraćaju se (2+ rezervacije)', value: loading ? '...' : `${returning}${customers.length ? ` (${Math.round((returning / customers.length) * 100)}%)` : ''}` },
          { label: 'Najbolji klijent', value: loading ? '...' : best && best.totalSpent > 0 ? `${best.name} · ${money(best.totalSpent)}` : '-' },
        ].map((card) => (
          <div key={card.label} className="min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-4 backdrop-blur">
            <p className="text-xs text-slate-400">{card.label}</p>
            <p className="mt-1 truncate text-xl font-bold tabular-nums text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sortiranje */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">Poredaj po:</span>
        {([['last', 'Zadnja posjeta'], ['spent', 'Potrošeno'], ['visits', 'Broj rezervacija']] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSort(value)}
            aria-pressed={sort === value}
            className={`rounded-full px-3.5 py-1.5 font-medium transition ${sort === value ? 'bg-blue-500 text-white' : 'border border-white/10 text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 backdrop-blur">
        {loading ? (
          <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}</div>
        ) : visibleCustomers.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-slate-500">{search ? 'Nema rezultata pretrage.' : 'Još nema evidentiranih klijenata. Pojavit će se čim prva rezervacija stigne.'}</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {visibleCustomers.map((customer) => (
              <li key={customer.key}>
                <button
                  type="button"
                  onClick={() => setSelectedKey(customer.key)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-300">
                    {customer.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 basis-48">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{customer.name}</span>
                      {tagsOf(customer).map((tag) => (
                        <span key={tag.label} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tag.tone}`}>{tag.label}</span>
                      ))}
                      {notes[customer.key] && <span title="Ima bilješku" className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                    </span>
                    <span className="block truncate text-xs text-slate-400">{customer.phone || customer.email || 'Kontakt nije naveden'}</span>
                  </span>
                  <span className="basis-24 text-xs text-slate-400">
                    <span className="block font-semibold tabular-nums text-slate-200">{customer.visits.length}</span>rezervacija
                  </span>
                  <span className="basis-36 text-xs text-slate-400">
                    <span className="block text-slate-200">{formatDate(customer.lastReservation)}</span>zadnja posjeta
                  </span>
                  <span className="basis-24 text-right text-sm font-semibold tabular-nums text-emerald-400">{money(customer.totalSpent)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detalji klijenta */}
      {selected && (
        <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label={`Klijent ${selected.name}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedKey('')} />
          <aside className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-gray-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-base font-bold text-blue-300">
                  {selected.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-white">{selected.name}</h3>
                  <p className="truncate text-xs text-slate-400">{selected.email || 'Email nije naveden'}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {tagsOf(selected).map((tag) => (
                      <span key={tag.label} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tag.tone}`}>{tag.label}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedKey('')} aria-label="Zatvori" className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex gap-2">
                {selected.phone && (
                  <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-medium text-slate-200 hover:border-blue-500/40">
                    <Icon name="phone" className="h-4 w-4 text-blue-400" /> Nazovi
                  </a>
                )}
                {waNumber(selected.phone) && (
                  <a href={`https://wa.me/${waNumber(selected.phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-medium text-slate-200 hover:border-emerald-500/40">
                    <Icon name="message" className="h-4 w-4 text-emerald-400" /> WhatsApp
                  </a>
                )}
              </div>

              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  ['Rezervacija', String(selected.visits.length)],
                  ['Završeno', String(selected.completed)],
                  ['Otkazano', String(selected.cancelled)],
                  ['Potrošeno', money(selected.totalSpent)],
                  ['Prosjek po terminu', selected.completed ? money(selected.totalSpent / selected.completed) : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white/[0.04] p-3">
                    <dd className="text-sm font-bold tabular-nums text-white">{value}</dd>
                    <dt className="mt-0.5 text-[11px] text-slate-400">{label}</dt>
                  </div>
                ))}
              </dl>

              <div>
                <label htmlFor="customer-note" className="text-sm font-semibold text-white">Bilješka</label>
                <p className="mt-0.5 text-xs text-slate-400">Vidite samo vi. Npr. alergije, omiljena usluga, dogovorena cijena.</p>
                <textarea
                  id="customer-note"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={2000}
                  rows={4}
                  className={`${inputClass} mt-3 resize-y`}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveNote}
                    disabled={savingNote || draft.trim() === (notes[selected.key] || '')}
                    className="rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
                  >
                    {savingNote ? 'Čuvanje...' : 'Sačuvaj bilješku'}
                  </button>
                  {noteMessage && <p role="status" className={`text-xs ${noteMessage.includes('sačuvana') ? 'text-emerald-400' : 'text-red-300'}`}>{noteMessage}</p>}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-white">Historija posjeta</h4>
                <ul className="space-y-2">
                  {[...selected.visits].sort((a, b) => b.date.localeCompare(a.date)).map((visit) => (
                    <li key={visit.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{visit.service}</p>
                        <p className="text-xs text-slate-400">{formatDate(visit.date)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-white">{visit.price}</p>
                        <p className={`text-[11px] font-medium ${statusTone(visit.status)}`}>{visit.status}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}