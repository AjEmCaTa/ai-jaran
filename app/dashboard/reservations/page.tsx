'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const formatDate = (dateString: any) => {
  if (!dateString) return '-';
  const cleanDate = dateString.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}.`;
  }
  return dateString;
};

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

  // Funkcija da gazda promijeni status rezervacije (npr. u "Prihvaćeno" ili "Završeno")
  const updateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchReservations();
    } catch (err: any) {
      alert('Greška pri izmjeni statusa: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Rezervacije i termini (Admin Panel)</h2>
          <p className="text-sm text-gray-400">Pregled svih prijava klijenata, datuma i naplate za Dubinsko Ćatić.</p>
        </div>
      </div>

      {/* Filteri */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-800">
        {['Sve', 'Na čekanju', 'Prihvaćeno', 'Završeno'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === tab 
                ? 'bg-blue-950 text-blue-400 border border-blue-800' 
                : 'text-gray-400 hover:bg-gray-900'
            }`}
          >
            {tab === 'Sve' ? 'Sve rezervacije' : tab}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
          Greška: {errorMsg}
        </div>
      )}

      {/* Tabela rezervacija */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Klijent / Telefon</th>
                <th className="py-3.5 px-6">Usluga</th>
                <th className="py-3.5 px-6">Datum i vrijeme</th>
                <th className="py-3.5 px-6">Cijena</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">Učitavanje prijava iz baze...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nema pristiglih prijava.
                  </td>
                </tr>
              ) : (
                reservations
                  .filter(res => filter === 'Sve' || res.status === filter)
                  .map((res) => (
                    <tr key={res.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-white">
                        {res.customer_name}
                        {res.customer_phone && <span className="block text-xs text-blue-400 font-normal">{res.customer_phone}</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-300">{res.service_name}</td>
                      <td className="py-4 px-6 text-gray-300">{res.reservation_date}</td>
                      <td className="py-4 px-6 font-semibold text-white">{res.price ? `${res.price} KM` : '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
                          res.status === 'Prihvaćeno' 
                            ? 'bg-green-950 text-green-400 border-green-800/50' 
                            : res.status === 'Završeno'
                            ? 'bg-blue-950 text-blue-400 border-blue-800/50'
                            : 'bg-yellow-950 text-yellow-400 border-yellow-800/50'
                        }`}>
                          {res.status || 'Na čekanju'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {res.status !== 'Prihvaćeno' && (
                          <button 
                            onClick={() => updateStatus(res.id, 'Prihvaćeno')}
                            className="px-2.5 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-xs hover:bg-green-600/30 cursor-pointer"
                          >
                            Prihvati
                          </button>
                        )}
                        {res.status !== 'Završeno' && (
                          <button 
                            onClick={() => updateStatus(res.id, 'Završeno')}
                            className="px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded text-xs hover:bg-blue-600/30 cursor-pointer"
                          >
                            Završi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}