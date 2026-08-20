'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function DashboardPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Povuci rezervacije
        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (resData) setReservations(resData);

        // Povuci broj usluga
        const { count } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        if (count !== null) setServicesCount(count);

      } catch (err) {
        console.error('Greška pri učitavanju dashboard podataka:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Izračunaj ukupnu zaradu iz rezervacija (ako imaju cijenu)
  const totalEarnings = reservations.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalReservations = reservations.length;
  const avgPrice = totalReservations > 0 ? Math.round(totalEarnings / totalReservations) : 0;

  return (
    <div className="space-y-6 text-gray-100">
      {/* Pozdravni dio */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Kontrolna ploča</h2>
          <p className="text-sm text-gray-400">Dobrodošao nazad! Evo pregleda tvog poslovanja.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-950 text-green-400 border border-green-800">
            🟢 Aktivan paket (Free)
          </span>
        </div>
      </div>

      {/* Kartice sa statistikama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ukupna zarada</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{totalEarnings} KM</span>
            <span className="text-xs font-semibold text-green-400">Iz baze</span>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ukupno rezervacija</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{totalReservations}</span>
            <span className="text-xs font-semibold text-green-400">Aktivnih termina</span>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Aktivnih usluga</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{servicesCount}</span>
            <span className="text-xs font-semibold text-blue-400">U cjenovniku</span>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prosječna cijena</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{avgPrice} KM</span>
            <span className="text-xs font-semibold text-gray-400">Po terminu</span>
          </div>
        </div>
      </div>

      {/* Sekcija za grafikon i termine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm">
          <h3 className="text-base font-semibold text-white mb-4">Pregled dolazaka i rezervacija</h3>
          <div className="h-64 flex items-center justify-center bg-gray-950 rounded-lg border border-dashed border-gray-800 text-gray-500 text-sm">
            Grafikon zarade i aktivnosti po mjesecima
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm">
          <h3 className="text-base font-semibold text-white mb-4">Nadolazeći termini</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-gray-500 text-center py-4">Učitavanje termina...</p>
            ) : reservations.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Nema unesenih rezervacija.</p>
            ) : (
              reservations.slice(0, 4).map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800/60">
                  <div>
                    <p className="text-sm font-medium text-white">{res.customer_name}</p>
                    <p className="text-xs text-gray-400">{res.reservation_date || res.service_name}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                    res.status === 'Prihvaćeno' 
                      ? 'bg-green-950 text-green-400 border-green-800/50' 
                      : 'bg-yellow-950 text-yellow-400 border-yellow-800/50'
                  }`}>
                    {res.status || 'Na čekanju'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}