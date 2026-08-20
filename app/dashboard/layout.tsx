import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar - Tamni meni */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <span className="text-xl font-bold tracking-tight text-blue-500">AI Jaran</span>
          </div>

          <div className="p-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Osnovno</p>
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
              <span>📊</span> Kontrolna ploča
            </Link>
            <Link href="/dashboard/reservations" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
              <span>📅</span> Rezervacije
            </Link>
            <Link href="/dashboard/services" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 text-gray-300 transition-colors">
              <span>⚙️</span> Usluge i cijene
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
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
            <span className="text-sm font-medium text-gray-400">Korisnik</span>
            <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              K
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