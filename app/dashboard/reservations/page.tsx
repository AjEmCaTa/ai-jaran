'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fullDate } from '../_lib/dates';
import PushToggle from '../_components/PushToggle';
import { allowedActions, statusKind, type ReservationAction } from '../../../utils/reservationFlow';

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


// "đ" se ne razlaže pri normalizaciji, pa ga ručno pretvaramo u "dj"
const normalizedStatus = (status: string | null) =>
  (status || 'Aktivno').toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isCancelledKey = (key: string) => ['otkazano', 'cancelled', 'canceled'].includes(key);
const isFinishedKey = (key: string) => ['zavrseno', 'completed', 'finished'].includes(key);
const isConfirmedKey = (key: string) => ['potvrdjeno', 'confirmed'].includes(key);

const badgeTone = (key: string) =>
  key === 'dogovor termina'
    ? 'border-violet-500/25 bg-violet-500/10 text-violet-300'
    : isFinishedKey(key)
    ? 'border-blue-500/25 bg-blue-500/10 text-blue-300'
    : isCancelledKey(key)
      ? 'border-red-500/25 bg-red-500/10 text-red-300'
      : isConfirmedKey(key)
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-300';

// Razlikovanje: zahtjev (čeka potvrdu), potvrđeno, dogovor termina, završeno, otkazano.
const statusLabel = (status: string | null) => (statusKind(status) === 'pending' ? 'Zahtjev' : status || 'Zahtjev');

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
  const [highlightId, setHighlightId] = useState('');
  const [rescheduleId, setRescheduleId] = useState('');
  const [rescheduleValue, setRescheduleValue] = useState('');

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
    const initialRefresh = window.setTimeout(() => {
      setHighlightId(new URLSearchParams(window.location.search).get('id') || '');
      refreshReservations();
    }, 0);
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

  const updateStatus = async (id: string, action: ReservationAction, reservationDate?: string) => {
    if (!supabase) return;
    if (action === 'cancel' && !window.confirm('Sigurno želite otkazati ovu rezervaciju?')) return;

    setBusyId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo za izmjenu rezervacije.');
      const response = await fetch('/api/dashboard/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ id, action, reservation_date: reservationDate }),
      });
      const result = await response.json();
      if (!response.ok) {
        // 409: već potvrđeno/otkazano, ili preklapanje termina; osvježi prikaz da se vidi stvarno stanje.
        if (response.status === 409) await fetchReservations(true);
        throw new Error(result.error || 'Status nije moguće promijeniti.');
      }

      setErrorMsg('');
      setRescheduleId('');
      setRescheduleValue('');
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
    const allowed = allowedActions(res.status);
    const busy = busyId === res.id;
    if (rescheduleId === res.id) {
      return (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="datetime-local"
            value={rescheduleValue}
            onChange={(event) => setRescheduleValue(event.target.value)}
            className="min-h-11 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-base text-white sm:text-xs"
            aria-label="Novi termin"
          />
          <button disabled={busy || !rescheduleValue} onClick={() => updateStatus(res.id, 'reschedule', rescheduleValue)} className={btnConfirm}>Sačuvaj termin</button>
          <button disabled={busy} onClick={() => setRescheduleId('')} className={btn + ' border-white/10 text-slate-300'}>Odustani</button>
        </div>
      );
    }
    return (
      <>
        {allowed.includes('confirm') && (
          <button disabled={busy} onClick={() => updateStatus(res.id, 'confirm')} className={btnConfirm}>Potvrdi</button>
        )}
        {allowed.includes('reschedule') && (
          <button disabled={busy} onClick={() => { setRescheduleId(res.id); setRescheduleValue(''); }} className={btn + ' border-violet-500/30 bg-violet-600/15 text-violet-300 hover:bg-violet-600/25'}>Dogovori termin</button>
        )}
        {allowed.includes('complete') && (
          <button disabled={busy} onClick={() => updateStatus(res.id, 'complete')} className={btnFinish}>Završi</button>
        )}
        {allowed.includes('cancel') && (
          <button disabled={busy} onClick={() => updateStatus(res.id, 'cancel')} className={btnCancel}>Otkaži</button>
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

      <PushToggle />

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
                    <tr key={res.id} className={`transition-colors hover:bg-white/[0.03] ${highlightId === res.id ? 'bg-blue-500/10' : ''}`}>
                      <td className="px-6 py-4 font-semibold text-white">
                        {res.customer_name || 'Klijent'}
                        {res.customer_phone && <span className="block text-[11px] font-normal text-blue-400">{res.customer_phone}</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{res.service_name || 'Usluga'}</td>
                      <td className="px-6 py-4 text-slate-300">{res.reservation_date ? fullDate(new Date(res.reservation_date)) : '-'}</td>
                      <td className="px-6 py-4 font-bold text-white">{priceLabel(res.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeTone(normalizedStatus(currentStatus))}`}>
                          {statusLabel(currentStatus)}
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
              <article key={res.id} className={`space-y-3 rounded-[var(--po-radius)] border bg-gray-900/70 p-4 ${highlightId === res.id ? 'border-blue-500' : 'border-white/[0.07]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-white">{res.customer_name || 'Klijent'}</h3>
                    <p className="mt-1 break-words text-xs text-blue-300">{res.customer_phone || 'Telefon nije naveden'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeTone(normalizedStatus(status))}`}>{statusLabel(status)}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/[0.06] pt-3 text-xs">
                  <div className="col-span-2 min-w-0"><dt className="text-slate-500">Usluga</dt><dd className="mt-0.5 break-words text-slate-200">{res.service_name || 'Usluga'}</dd></div>
                  <div><dt className="text-slate-500">Datum i vrijeme</dt><dd className="mt-0.5 text-slate-200">{res.reservation_date ? fullDate(new Date(res.reservation_date)) : '-'}</dd></div>
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