'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('Sve');

  const fetchReservations = async () => {
    if (!supabase) {
      setLoading(false);
      setErrorMsg('Supabase nije konfigurisan.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReservations(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id)
        .select();

      if (error) {
        alert('Greška iz baze: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert('Baza je odbila izmjenu! Provjeri RLS politike.');
        return;
      }

      await fetchReservations();
    } catch (err: any) {
      alert('Došlo je do greške: ' + err.message);
    }
  };

  const filteredReservations = reservations.filter(res => {
    const currentStatus = (res.status || 'Aktivno').toLowerCase();
    if (filter === 'Sve') return true;
    if (filter === 'Aktivno') return currentStatus === 'aktivno' || currentStatus === 'na čekanju' || currentStatus === 'potvrđeno';
    if (filter === 'Završeno') return currentStatus === 'završeno' || currentStatus === 'zavrseno';
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
      <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-800">
        {['Sve', 'Aktivno', 'Završeno', 'Otkazano'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
      <div className="bg-gray-900/60 rounded-2xl border border-gray-800 shadow-xl overflow-hidden backdrop-blur-md">
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
                  const clientName = res.customer_name || res.client_name || res.name || 'Klijent';
                  const clientPhone = res.customer_phone || res.client_phone || res.phone || '';
                  const serviceName = res.service_name || res.service || 'Usluga';
                  const resDate = res.reservation_date || res.date || res.created_at || '-';
                  const resPrice = res.price ? (String(res.price).includes('KM') ? res.price : `${res.price} KM`) : '25 KM';
                  const currentStatus = res.status || 'Aktivno';

                  const isCancelled = currentStatus.toLowerCase() === 'otkazano' || currentStatus.toLowerCase() === 'cancelled';
                  const isFinished = currentStatus.toLowerCase() === 'završeno' || currentStatus.toLowerCase() === 'zavrseno';

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
                            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer"
                          >
                            Završi
                          </button>
                        )}
                        {!isCancelled && (
                          <button 
                            onClick={() => updateStatus(res.id, 'Otkazano')}
                            className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition cursor-pointer"
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
    </div>
  );
}