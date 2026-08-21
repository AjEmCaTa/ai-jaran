'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Povuci rezervacije iz baze
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (resError) {
          console.log("Tabela reservations se još puni ili ne postoji:", resError.message);
        } else if (resData) {
          setReservations(resData);
        }

        // Povuci broj usluga iz cjenovnika
        const { count, error: countError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        if (!countError && count !== null) {
          setServicesCount(count);
        }
      } catch (err) {
        console.error('Greška pri učitavanju dashboard podataka:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Izračunaj statistike u realnom vremenu
  const totalEarnings = reservations.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalReservations = reservations.length;
  const pendingCount = reservations.filter((r) => r.status === 'Na čekanju' || !r.status).length;
  const avgPrice = totalReservations > 0 ? Math.round(totalEarnings / totalReservations) : 0;

  return (
    <div className="space-y-8 text-gray-100 max-w-[1600px] mx-auto pb-12">
      
      {/* Header Dashboarda - SaaS Stil */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Dubinsko Ćatić • <span className="text-blue-400">Kontrolna ploča</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Vrapčići, Mostar • Tel: 060 30 50 153 • Live baza podataka</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            Sistem Aktivan & Online
          </span>
        </div>
      </div>

      {/* Kartice sa statistikama (SaaS metrike gore) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0b0f19] border border-white/5 p-6 rounded-2xl shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ukupna zarada</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{totalEarnings} KM</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Iz baze</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 p-6 rounded-2xl shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ukupno rezervacija</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{totalReservations}</span>
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Aktivni termini</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 p-6 rounded-2xl shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Zahtjevi na čekanju</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-yellow-400">{pendingCount}</span>
            <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">Za potvrdu</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 p-6 rounded-2xl shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aktivnih usluga</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{servicesCount > 0 ? servicesCount : '2+'}</span>
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">U cjenovniku</span>
          </div>
        </div>
      </div>

      {/* Sekcija: Paketi i Nadolazeći termini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lijevi dio: Prikaz paketa usluga */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-white/5 p-6 rounded-2xl shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-white">Pregled usluga i paketa</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#030712] rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white text-sm">Basic Paket / Detalji</span>
                <span className="text-blue-400 font-semibold text-xs bg-blue-500/10 px-2 py-0.5 rounded">20 - 25 KM</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Osnovno čišćenje, pojedinačni dijelovi i brzi tretmani.</p>
            </div>

            <div className="p-4 bg-[#030712] rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white text-sm">Premium Dubinsko</span>
                <span className="text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2 py-0.5 rounded">120 - 150 KM</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Kompletno dubinsko čišćenje vozila uz besplatan dolazak po auto.</p>
            </div>
          </div>

          <div className="h-40 flex flex-col items-center justify-center bg-[#030712] rounded-xl border border-dashed border-white/10 text-gray-500 text-xs">
            <p className="font-medium text-gray-400">Statistika i analitika prihoda</p>
            <p className="text-[11px] text-gray-600 mt-1">Podaci se automatski sinhronizuju sa Supabase bazom</p>
          </div>
        </div>

        {/* Desni dio: Lista rezervacija i kalendar feed */}
        <div className="bg-[#0b0f19] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Nadolazeći termini</h3>
            
            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-gray-500 text-center py-8">Učitavanje termina iz baze...</p>
              ) : reservations.length === 0 ? (
                <div className="text-center py-10 px-4 bg-[#030712] rounded-xl border border-white/5">
                  <p className="text-sm font-medium text-gray-300">Nema unesenih rezervacija.</p>
                  <p className="text-xs text-gray-500 mt-1">Novi termini klijenatskih rezervacija pojavit će se ovdje u realnom vremenu.</p>
                </div>
              ) : (
                reservations.slice(0, 5).map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-3.5 bg-[#030712] rounded-xl border border-white/5">
                    <div>
                      <p className="text-sm font-semibold text-white">{res.customer_name || res.client_name || 'Klijent'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{res.reservation_date || res.service_name || 'Dubinsko čišćenje'}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      res.status === 'Prihvaćeno' || res.status === 'confirmed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {res.status || 'Na čekanju'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <span className="text-[11px] text-gray-500">Dubinsko Ćatić • SaaS Booking Platform</span>
          </div>
        </div>

      </div>
    </div>
  );
}