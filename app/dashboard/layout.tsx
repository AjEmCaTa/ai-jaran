import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar - Tamni meni */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo i Naziv Biznisa */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-800">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-600/30">
              HĆ
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">Dubinsko Ćatić</span>
              <span className="text-[10px] text-gray-400 block">Vrapčići, Mostar</span>
            </div>
          </div>

          <div className="p-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Osnovno</p>
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
              <span>📊</span> Kontrolna ploča
            </Link>
            <Link href="/dashboard/reservations" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
              <span>📅</span> Rezervacije i kalendar
            </Link>
            <Link href="/dashboard/services" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
              <span>⚙️</span> Usluge i cijene
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-gray-950/50 border border-gray-800/60">
            <p className="text-[11px] text-gray-400">Info telefon:</p>
            <p className="text-xs font-semibold text-blue-400">060 30 50 153</p>
          </div>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
            <span>🔧</span> Postavke
          </Link>
        </div>
      </aside>

      {/* Glavni sadržaj */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-100">Panel za upravljanje</h1>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-medium text-gray-200 block">Dubinsko Ćatić</span>
              <span className="text-xs text-gray-400 block">Administrator</span>
            </div>
            <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
              HĆ
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