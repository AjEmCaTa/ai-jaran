'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export default function DashboardPage() {
  const [businessName, setBusinessName] = useState('Moj Biznis');
  const [businessCity, setBusinessCity] = useState('');
  const [userName, setUserName] = useState('Korisnik');
  const [loading, setLoading] = useState(true);

  // Dinamička statistika iz baze
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalReservationsCount, setTotalReservationsCount] = useState(0);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setLoading(false);
          return;
        }

        // 1. Povlačenje profila ulogovanog korisnika/biznisa
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setBusinessName(profile.business_name || profile.full_name || 'Moj Biznis');
          setBusinessCity(profile.city || 'Mostar');
          setUserName(profile.full_name || user.email || 'Admin');
        }

        // 2. Povlačenje rezervacija vezanih za ovog korisnika / biznis
        const { data: reservationsData, error: resError } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!resError && reservationsData) {
          setTotalReservationsCount(reservationsData.length);
          setRecentBookings(reservationsData.slice(0, 5)); // Uzimamo 5 najnovijih

          // Računanje zarade: zbrajamo cijene za sve rezervacije čiji status NIJE Otkazano
          let sum = 0;
          reservationsData.forEach((res) => {
            const status = (res.status || '').toLowerCase();
            // Ako nije otkazano, uračunaj u zaradu
            if (status !== 'otkazano' && status !== 'cancelled') {
              // Izvuci brojčanu vrijednost iz cijene (npr. "25 KM" -> 25)
              const priceStr = String(res.price || '0').replace(/[^0-9.]/g, '');
              const priceNum = parseFloat(priceStr) || 0;
              sum += priceNum;
            }
          });
          setTotalEarnings(sum);
        }

        // 3. Povlačenje broja aktivnih usluga iz cjenovnika
        const { count: servicesCount, error: servError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        if (!servError && servicesCount !== null) {
          setActiveServicesCount(servicesCount);
        } else {
          // Ako tabela koristi drugo ime ili ima podatke
          const { data: servicesData } = await supabase.from('services').select('*');
          if (servicesData) {
            setActiveServicesCount(servicesData.length);
          }
        }

      } catch (err) {
        console.error("Greška pri učitavanju dashboard podataka:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Kontrolna ploča</h2>
          <p className="text-slate-400 text-sm mt-1">
            Dobrodošli nazad, <span className="text-white font-medium">{userName}</span>. Pregled poslovanja za <span className="text-blue-400 font-semibold">{businessName}</span> {businessCity && `(${businessCity})`}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/reservations" 
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            + Upravljaj terminima
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        {/* Ukupna Zarada */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/40 border border-gray-800 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Ukupna zarada</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{totalEarnings} KM</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Automatski obračun</p>
        </div>

        {/* Ukupno rezervacija */}
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Ukupno rezervacija</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalReservationsCount}</span>
            <span className="text-xs text-blue-400 font-medium">prijava</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Svi termini u bazi</p>
        </div>

        {/* Aktivne usluge */}
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Aktivne usluge</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400">{activeServicesCount}</span>
            <span className="text-xs text-slate-400 font-medium">u cjenovniku</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Direktno iz baze</p>
        </div>

        {/* AI Jaran Asistent */}
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">AI Jaran Asistent</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-emerald-400">Aktivan i spreman</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Sistem radi besprijekorno</p>
        </div>
      </div>

      {/* Recent Bookings Table Section */}
      <div className="rounded-2xl bg-gray-900/60 border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Nedavne rezervacije</h3>
          <Link href="/dashboard/reservations" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition">
            Vidi sve u kalendaru →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Klijent / Telefon</th>
                <th className="py-3.5 px-6">Usluga</th>
                <th className="py-3.5 px-6">Cijena</th>
                <th className="py-3.5 px-6">Termin</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Učitavanje podataka...</td>
                </tr>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Još uvijek nema zabilježenih rezervacija.</td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  const clientName = b.customer_name || b.client_name || b.name || 'Klijent';
                  const clientPhone = b.customer_phone || b.client_phone || b.phone || '';
                  const serviceName = b.service_name || b.service || 'Usluga';
                  const price = b.price ? (String(b.price).includes('KM') ? b.price : `${b.price} KM`) : '25 KM';
                  const date = b.reservation_date || b.date || b.created_at || '-';
                  const status = b.status || 'Na čekanju';

                  const isCancelled = status.toLowerCase() === 'otkazano' || status.toLowerCase() === 'cancelled';
                  const isFinished = status.toLowerCase() === 'završeno' || status.toLowerCase() === 'zavrseno';

                  return (
                    <tr key={b.id || Math.random()} className="hover:bg-gray-800/30 transition">
                      <td className="py-4 px-6 font-semibold text-white">
                        {clientName}
                        {clientPhone && <span className="block text-[11px] text-blue-400 font-normal">{clientPhone}</span>}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{serviceName}</td>
                      <td className="py-4 px-6 font-bold text-white">{price}</td>
                      <td className="py-4 px-6 text-slate-300">{date}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : isFinished
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {status}
                        </span>
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