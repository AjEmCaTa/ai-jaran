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

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('Sve');

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

  const updateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;

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

      await fetchReservations();
    } catch (err) {
      alert('Došlo je do greške: ' + (err instanceof Error ? err.message : 'Pokušajte ponovo.'));
    }
  };

  const normalizedStatus = (status: string | null) => (status || 'Aktivno').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredReservations = reservations.filter((res) => {
    const currentStatus = normalizedStatus(res.status);
    if (filter === 'Sve') return true;
    if (filter === 'Aktivno') return ['aktivno', 'na cekanju', 'potvrdeno', 'potvrdjeno'].includes(currentStatus);
    if (filter === 'Završeno') return currentStatus === 'zavrseno' || currentStatus === 'completed';
    if (filter === 'Otkazano') return currentStatus === 'otkazano' || currentStatus === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6 text-gray-100 pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Rezervacije i kalendar</h2>
        <p className="text-slate-400 text-sm mt-1">Automatski pregled svih prijava klijenata, termina i statusa.</p>
      </div>

      {/* Filteri */}
      <div className="grid grid-cols-2 gap-2 border-b border-gray-800 pb-3 sm:flex sm:flex-wrap">
        {['Sve', 'Aktivno', 'Završeno', 'Otkazano'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`min-h-11 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer sm:px-4 ${
              filter === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500' 
                : 'bg-gray-900 text-slate-400 border border-gray-800 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {tab === 'Sve' ? 'Sve rezervacije' : tab}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm">
          Greška: {errorMsg}
        </div>
      )}

      {/* Tabela rezervacija */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-xl backdrop-blur-md lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Klijent / Telefon</th>
                <th className="py-4 px-6">Usluga</th>
                <th className="py-4 px-6">Datum i vrijeme</th>
                <th className="py-4 px-6">Cijena</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">Učitavanje prijava iz baze...</td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nema pristiglih prijava u ovoj kategoriji.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const clientName = res.customer_name || 'Klijent';
                  const clientPhone = res.customer_phone || '';
                  const serviceName = res.service_name || 'Usluga';
                  const resDate = res.reservation_date ? new Date(res.reservation_date).toLocaleString('bs-BA') : '-';
                  const resPrice = res.price != null && res.price !== '' ? (String(res.price).includes('KM') ? res.price : `${res.price} KM`) : '-';
                  const currentStatus = res.status || 'Aktivno';

                  const statusKey = normalizedStatus(currentStatus);
                  const isCancelled = ['otkazano', 'cancelled', 'canceled'].includes(statusKey);
                  const isFinished = ['zavrseno', 'completed', 'finished'].includes(statusKey);

                  return (
                    <tr key={res.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        {clientName}
                        {clientPhone && <span className="block text-[11px] text-blue-400 font-normal">{clientPhone}</span>}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{serviceName}</td>
                      <td className="py-4 px-6 text-slate-300">{resDate}</td>
                      <td className="py-4 px-6 font-bold text-white">{resPrice}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          isFinished
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : isCancelled
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {!isFinished && (
                          <button 
                            onClick={() => updateStatus(res.id, 'Završeno')}
                            className="min-h-11 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer"
                          >
                            Završi
                          </button>
                        )}
                        {!isCancelled && (
                          <button 
                            onClick={() => updateStatus(res.id, 'Otkazano')}
                            className="min-h-11 px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition cursor-pointer"
                          >
                            Otkaži
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Učitavanje prijava iz baze...</p>
          : filteredReservations.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-10 text-center text-sm text-slate-500">Nema pristiglih prijava u ovoj kategoriji.</p>
            : filteredReservations.map((res) => {
              const status = res.status || 'Aktivno';
              const statusKey = normalizedStatus(status);
              const isCancelled = ['otkazano', 'cancelled', 'canceled'].includes(statusKey);
              const isFinished = ['zavrseno', 'completed', 'finished'].includes(statusKey);
              return (
                <article key={res.id} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-white">{res.customer_name || 'Klijent'}</h3>
                      <p className="mt-1 break-words text-xs text-blue-300">{res.customer_phone || 'Telefon nije naveden'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isFinished ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : isCancelled ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{status}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-800 pt-3 text-xs">
                    <div className="col-span-2 min-w-0"><dt className="text-slate-500">Usluga</dt><dd className="mt-0.5 break-words text-slate-200">{res.service_name || 'Usluga'}</dd></div>
                    <div><dt className="text-slate-500">Datum i vrijeme</dt><dd className="mt-0.5 text-slate-200">{res.reservation_date ? new Date(res.reservation_date).toLocaleString('bs-BA') : '-'}</dd></div>
                    <div><dt className="text-slate-500">Cijena</dt><dd className="mt-0.5 font-semibold text-white">{res.price != null && res.price !== '' ? `${res.price}${String(res.price).includes('KM') ? '' : ' KM'}` : '-'}</dd></div>
                  </dl>
                  <div className="flex flex-wrap gap-2 border-t border-gray-800 pt-3">
                    {!isFinished && <button onClick={() => updateStatus(res.id, 'Završeno')} className="min-h-11 flex-1 rounded-lg border border-blue-500/30 bg-blue-600/15 px-3 py-2 text-xs font-semibold text-blue-300">Završi</button>}
                    {!isCancelled && <button onClick={() => updateStatus(res.id, 'Otkazano')} className="min-h-11 flex-1 rounded-lg border border-red-500/30 bg-red-600/15 px-3 py-2 text-xs font-semibold text-red-300">Otkaži</button>}
                  </div>
                </article>
              );
            })}
      </div>
    </div>
  );
}