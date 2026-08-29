'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Background from '../../../components/Background';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  badge?: string;
  desc: string;
  features: string[];
}

export default function DubinskoCaticPage() {
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const packages: ServicePackage[] = [
    { 
      id: 'basic', 
      name: 'Basic Paket', 
      price: '25 KM',
      badge: 'Brzo & Efikasno',
      desc: 'Idealan za parcijalno čišćenje i osvježenje enterijera.',
      features: ['Dubinsko pranje 2 prednja sjedišta', 'Osvježavanje mirisa', 'Osnovno usisavanje'] 
    },
    { 
      id: 'premium', 
      name: 'Premium Paket', 
      price: '130 KM',
      badge: 'Najpopularnije 🔥',
      desc: 'Kompletno detaljno dubinsko pranje cijelog vozila.',
      features: ['Vađenje i pranje svih sjedišta', 'Tepisi i krovni tapacirung', 'Zaštita i sjaj svih plastika', 'Kompletno vanjsko pranje'] 
    }
  ];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !resDate || !resTime || !clientName || !clientPhone || !clientEmail) {
      alert('Molimo vas da popunite sva polja i izaberete paket.');
      return;
    }
    if (!supabase) {
      alert('Baza podataka trenutno nije povezana.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const { error } = await supabase.from('reservations').insert([
        {
          customer_name: clientName,
          customer_phone: clientPhone,
          service_name: selectedPackage.name,
          price: Number(selectedPackage.price.replace(/[^0-9]/g, '')) || 0,
          reservation_date: `${resDate}T${resTime}:00`,
          status: 'Na čekanju',
        },
      ]);

      if (error) throw error;

      setSuccessMsg('Uspješno ste poslali zahtjev za termin! Očekujte brzu potvrdu.');
      setSelectedPackage(null);
      setResDate('');
      setResTime('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
    } catch (err: any) {
      alert('Greška prilikom rezervacije: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />
      <Navbar brandName="AI Jaran" onOpenContact={() => {}} onResetHero={() => {}} onOpenCatalog={() => {}} />

      <div className="pt-32 pb-24 px-4 max-w-6xl mx-auto space-y-10">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/katalog/dubinsko-ciscenje" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-blue-400 bg-[#0b0f19] px-4 py-2.5 rounded-xl border border-white/10 transition-all hover:border-blue-500/40"
          >
            ← Nazad na partnere
          </Link>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Slobodni termini za danas
          </span>
        </div>

        {/* Hero Banner / Profile */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e172a] to-[#0b0f19] border border-white/10 p-6 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                🌟 Certificirani AI Jaran Partner
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Dubinsko Ćatić
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-300 pt-1">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  📍 Vrapčići, Mostar
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  📞 060 30 50 153
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-blue-400">
                  🕒 Pon – Sub: 07:00 – 17:00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xl">
            <span className="text-xl">🎉</span> {successMsg}
          </div>
        )}

        {/* KORAK 1: Odabir paketa */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30">1</span>
            <h2 className="text-xl font-bold text-white">Izaberite paket usluge</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-6 rounded-3xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-gradient-to-b from-blue-900/20 to-[#0b0f19] border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.01]' 
                      : 'bg-[#0b0f19] border-white/10 hover:border-white/25 hover:bg-[#0e1424]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                          {pkg.badge}
                        </span>
                        <h3 className="text-2xl font-extrabold text-white mt-2">{pkg.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-blue-400 block">{pkg.price}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">{pkg.desc}</p>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="text-blue-400 font-bold">✓</span> {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">
                      {isSelected ? 'Odabrano' : 'Klikni za odabir'}
                    </span>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/20'
                    }`}>
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KORAK 2 & 3: Termini i Podaci */}
        <form onSubmit={handleBooking} className="space-y-10">
          
          {/* Korak 2: Termin */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30">2</span>
              <h2 className="text-xl font-bold text-white">Odaberite datum i vrijeme</h2>
            </div>

            <div className="bg-[#0b0f19] border border-white/10 p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Datum dolaska</label>
                <input 
                  type="date" 
                  required
                  value={resDate} 
                  onChange={e => setResDate(e.target.value)} 
                  className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Željeno vrijeme</label>
                <input 
                  type="time" 
                  required
                  value={resTime} 
                  onChange={e => setResTime(e.target.value)} 
                  className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Korak 3: Podaci */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30">3</span>
              <h2 className="text-xl font-bold text-white">Vaši kontakt podaci</h2>
            </div>

            <div className="bg-[#0b0f19] border border-white/10 p-6 rounded-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Ime i prezime</label>
                  <input 
                    type="text" 
                    required
                    placeholder="npr. Harun Ćatić" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                    className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Broj telefona</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="060 123 4567" 
                    value={clientPhone} 
                    onChange={e => setClientPhone(e.target.value)} 
                    className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">E-mail adresa</label>
                <input 
                  type="email" 
                  required
                  placeholder="vasa.adresa@email.com" 
                  value={clientEmail} 
                  onChange={e => setClientEmail(e.target.value)} 
                  className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Submit Action Block */}
          <div className="bg-gradient-to-r from-blue-900/30 via-[#0b0f19] to-blue-900/30 border border-blue-500/30 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                Pregled rezervacije
              </span>
              <p className="text-base font-extrabold text-white">
                {selectedPackage 
                  ? `${selectedPackage.name} — ${selectedPackage.price}` 
                  : '⚠️ Niste još izabrali paket'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Plaćanje se vrši na licu mjesta nakon završenog čišćenja.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedPackage}
              className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Spremanje...' : 'Potvrdi i rezerviši termin 🚀'}
            </button>
          </div>

        </form>

      </div>

      <Footer t={{ rights: "Sva prava zadržana.", privacy: "Politika privatnosti" }} brandName="AI Jaran" onOpenPrivacy={() => {}} />
    </main>
  );
}