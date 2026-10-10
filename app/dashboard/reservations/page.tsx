'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

type Reservation = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
  reservation_date: string | null;
  price: string | number | null;
  status: string | null;
};

type NewStatus = 'Potvrđeno' | 'Završeno' | 'Otkazano';

// "đ" se ne razlaže pri normalizaciji, pa ga ručno pretvaramo u "dj"
const normalizedStatus = (status: string | null) =>
  (status || 'Aktivno').toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isCancelledKey = (key: string) => ['otkazano', 'cancelled', 'canceled'].includes(key);
const isFinishedKey = (key: string) => ['zavrseno', 'completed', 'finished'].includes(key);
const isConfirmedKey = (key: string) => ['potvrdjeno', 'confirmed'].includes(key);

const badgeTone = (key: string) =>
  isFinishedKey(key)
    ? 'border-blue-500/25 bg-blue-500/10 text-blue-300'
    : isCancelledKey(key)
      ? 'border-red-500/25 bg-red-500/10 text-red-300'
      : isConfirmedKey(key)
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-300';

const priceLabel = (price: string | number | null) =>
  price != null && price !== '' ? (String(price).includes('KM') ? String(price) : `${price} KM`) : '-';

const btn = 'min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50';
const btnConfirm = `${btn} border-emerald-500/30 bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/25`;
const btnFinish = `${btn} border-blue-500/30 bg-blue-600/15 text-blue-300 hover:bg-blue-600/25`;
const btnCancel = `${btn} border-red-500/30 bg-red-600/15 text-red-300 hover:bg-red-600/25`;

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('Sve');
  const [busyId, setBusyId] = useState('');

  const fetchReservations = useCallback(async (silent = false) => {
    if (!supabase) {
      await Promise.resolve();
      setLoading(false);
      setErrorMsg('Supabase nije konfigurisan.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!silent) setLoading(true);
      if (!session) throw new Error('Prijavite se ponovo za pregled rezervacija.');
      const response = await fetch('/api/dashboard/reservations', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Rezervacije nije moguće učitati.');
      setReservations(result.reservations || []);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Rezervacije nije moguće učitati.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshReservations = useEffectEvent((silent = false) => {
    void fetchReservations(silent);
  });

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => refreshReservations(), 0);
    const refresh = () => {
      if (document.visibilityState === 'visible') refreshReservations(true);
    };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const updateStatus = async (id: string, newStatus: NewStatus) => {
    if (!supabase) return;
    if (newStatus === 'Otkazano' && !window.confirm('Sigurno želite otkazati ovu rezervaciju?')) return;

    setBusyId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo za izmjenu rezervacije.');
      const response = await fetch('/api/dashboard/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Status nije moguće promijeniti.');

      setErrorMsg('');
      await fetchReservations(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Pokušajte ponovo.');
    } finally {
      setBusyId('');
    }
  };

  const filteredReservations = reservations.filter((res) => {
    const key = normalizedStatus(res.status);
    if (filter === 'Sve') return true;
    if (filter === 'Aktivno') return !isFinishedKey(key) && !isCancelledKey(key);
    if (filter === 'Završeno') return isFinishedKey(key);
    if (filter === 'Otkazano') return isCancelledKey(key);
    return true;
  });

  const actions = (res: Reservation) => {
    const key = normalizedStatus(res.status);
    const finished = isFinishedKey(key);
    const cancelled = isCancelledKey(key);
    const confirmed = isConfirmedKey(key);
    return (
      <>
        {!finished && !cancelled && !confirmed && (
          <button disabled={busyId === res.id} onClick={() => updateStatus(res.id, 'Potvrđeno')} className={btnConfirm}>Potvrdi</button>
        )}
        {!finished && (
          <button disabled={busyId === res.id} onClick={() => updateStatus(res.id, 'Završeno')} className={btnFinish}>Završi</button>
        )}
        {!cancelled && (
          <button disabled={busyId === res.id} onClick={() => updateStatus(res.id, 'Otkazano')} className={btnCancel}>Otkaži</button>
        )}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 text-gray-100">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Rezervacije i kalendar</h2>
        <p className="mt-1 text-sm text-slate-400">Automatski pregled svih prijava klijenata, termina i statusa.</p>
      </div>

      {/* Filteri */}
      <div className="grid grid-cols-2 gap-2 border-b border-white/[0.06] pb-3 sm:flex sm:flex-wrap">
        {['Sve', 'Aktivno', 'Završeno', 'Otkazano'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            aria-pressed={filter === tab}
            className={`min-h-11 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              filter === tab
                ? 'border border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'border border-white/10 bg-gray-900 text-slate-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {tab === 'Sve' ? 'Sve rezervacije' : tab}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
          {errorMsg}
        </div>
      )}

      {/* Tabela rezervacija */}
      <div className="hidden overflow-hidden rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 shadow-xl backdrop-blur-md lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-gray-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Klijent / Telefon</th>
                <th className="px-6 py-4">Usluga</th>
                <th className="px-6 py-4">Datum i vrijeme</th>
                <th className="px-6 py-4">Cijena</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs text-slate-300">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Učitavanje prijava iz baze...</td></tr>
              ) : filteredReservations.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Nema pristiglih prijava u ovoj kategoriji.</td></tr>
              ) : (
                filteredReservations.map((res) => {
                  const currentStatus = res.status || 'Aktivno';
                  return (
                    <tr key={res.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-6 py-4 font-semibold text-white">
                        {res.customer_name || 'Klijent'}
                        {res.customer_phone && <span className="block text-[11px] font-normal text-blue-400">{res.customer_phone}</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{res.service_name || 'Usluga'}</td>
                      <td className="px-6 py-4 text-slate-300">{res.reservation_date ? new Date(res.reservation_date).toLocaleString('bs-BA') : '-'}</td>
                      <td className="px-6 py-4 font-bold text-white">{priceLabel(res.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeTone(normalizedStatus(currentStatus))}`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="space-x-2 px-6 py-4 text-right">{actions(res)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kartice za mobitel */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Učitavanje prijava iz baze...</p>
        ) : filteredReservations.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-gray-900/60 px-4 py-10 text-center text-sm text-slate-500">Nema pristiglih prijava u ovoj kategoriji.</p>
        ) : (
          filteredReservations.map((res) => {
            const status = res.status || 'Aktivno';
            return (
              <article key={res.id} className="space-y-3 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-white">{res.customer_name || 'Klijent'}</h3>
                    <p className="mt-1 break-words text-xs text-blue-300">{res.customer_phone || 'Telefon nije naveden'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeTone(normalizedStatus(status))}`}>{status}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/[0.06] pt-3 text-xs">
                  <div className="col-span-2 min-w-0"><dt className="text-slate-500">Usluga</dt><dd className="mt-0.5 break-words text-slate-200">{res.service_name || 'Usluga'}</dd></div>
                  <div><dt className="text-slate-500">Datum i vrijeme</dt><dd className="mt-0.5 text-slate-200">{res.reservation_date ? new Date(res.reservation_date).toLocaleString('bs-BA') : '-'}</dd></div>
                  <div><dt className="text-slate-500">Cijena</dt><dd className="mt-0.5 font-semibold text-white">{priceLabel(res.price)}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3 [&>button]:flex-1">{actions(res)}</div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}