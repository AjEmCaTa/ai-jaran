'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('Sve');

  // Funkcija za povlačenje rezervacija iz baze
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

  return (
    <div className="space-y-6 text-gray-100">
      {/* Naslov i dugme za dodavanje nove rezervacije */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Rezervacije i termini</h2>
          <p className="text-sm text-gray-400">Pregledaj sve dolaske, zakazane termine i status naplate.</p>
        </div>
        <button 
          onClick={() => alert('Ovdje otvaramo modal za novu rezervaciju!')}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          + Nova rezervacija
        </button>
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
                <th className="py-3.5 px-6">Klijent / Gost</th>
                <th className="py-3.5 px-6">Usluga / Detalji</th>
                <th className="py-3.5 px-6">Datum i vrijeme</th>
                <th className="py-3.5 px-6">Cijena</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Učitavanje rezervacija iz baze...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nemate unesenih rezervacija. Kliknite gore desno na "+ Nova rezervacija" da dodate termin.
                  </td>
                </tr>
              ) : (
                reservations
                  .filter(res => filter === 'Sve' || res.status === filter)
                  .map((res) => (
                    <tr key={res.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-white">
                        {res.customer_name}
                        {res.customer_phone && <span className="block text-xs text-gray-400">{res.customer_phone}</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-400">{res.service_name}</td>
                      <td className="py-4 px-6 text-gray-400">{res.reservation_date || '-'}</td>
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