'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [fullName, setFullName] = useState('Harun Ćatić');
  const [businessName, setBusinessName] = useState('Dubinsko čišćenje Ćatić');
  const [businessCity, setBusinessCity] = useState('Mostar');
  const [initials, setInitials] = useState('HĆ');

  useEffect(() => {
    async function loadLayoutData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          const name = profile.full_name || profile.name || 'Harun Ćatić';
          const bName = profile.business_name || 'Dubinsko čišćenje Ćatić';
          const city = profile.city || 'Mostar';

          setFullName(name);
          setBusinessName(bName);
          setBusinessCity(city);
          
          const parts = name.split(' ');
          if (parts.length >= 2) {
            setInitials((parts[0][0] + parts[1][0]).toUpperCase());
          } else if (name.length > 0) {
            setInitials(name.substring(0, 2).toUpperCase());
          }
        }
      } catch (err) {
        console.error("Greška pri učitavanju layout podataka:", err);
      }
    }

    loadLayoutData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar - Tamni meni */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Ime gore lijevo, ispod biznis i lokacija */}
          <div className="p-5 border-b border-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-600/30 shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">{fullName}</span>
              <span className="text-[11px] text-blue-400 font-medium block truncate">{businessName}</span>
              <span className="text-[10px] text-gray-400 block truncate">{businessCity}</span>
            </div>
          </div>

          <div className="p-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Osnovno</p>
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard' 
                  ? 'bg-blue-950 text-blue-400 border border-blue-800/50' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <span>📊</span> Kontrolna ploča
            </Link>
            <Link 
              href="/dashboard/reservations" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname?.includes('/reservations') 
                  ? 'bg-blue-950 text-blue-400 border border-blue-800/50' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <span>📅</span> Rezervacije i kalendar
            </Link>
            <Link 
              href="/dashboard/services" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname?.includes('/services') 
                  ? 'bg-blue-950 text-blue-400 border border-blue-800/50' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <span>⚙️</span> Usluge i cijene
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="px-3 py-2 rounded-lg bg-gray-950/50 border border-gray-800/60">
            <p className="text-[11px] text-gray-400">AI Jaran Podrška:</p>
            <p className="text-xs font-semibold text-blue-400">060 30 50 153</p>
          </div>
        </div>
      </aside>

      {/* Glavni sadržaj */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-sm font-bold text-gray-300">Panel za upravljanje</h1>
          
          {/* Očišćen desni gornji ugao */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">
              AI
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}