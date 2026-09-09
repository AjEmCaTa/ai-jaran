'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

const ADMIN_EMAILS = ['caticharun126@gmail.com'];

export default function MasterPanelPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      await loadBusinesses();
    }
    checkAndLoad();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBusinesses(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    await supabase.from('businesses').update({ status: newStatus }).eq('id', id);
    await loadBusinesses();
    setUpdatingId(null);
  };

  if (authorized === null || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
        Ucitavanje...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
        Nemas pristup ovoj stranici.
      </div>
    );
  }

  const pending = businesses.filter(b => b.status !== 'active');
  const active = businesses.filter(b => b.status === 'active');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 space-y-8">
      <h1 className="text-2xl font-black text-white">Master Panel - Odobravanje biznisa</h1>

      <div>
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Na cekanju ({pending.length})</h2>
        <div className="space-y-3">
          {pending.length === 0 && (
            <p className="text-slate-500 text-sm">Nema zahtjeva na cekanju.</p>
          )}
          {pending.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-amber-500/20">
              <div>
                <p className="font-bold text-white">{b.name}</p>
                <p className="text-xs text-slate-400">{b.category} • {b.city} • {b.phone}</p>
                <p className="text-xs text-slate-500">{b.owner_email}</p>
              </div>
              <button
                onClick={() => updateStatus(b.id, 'active')}
                disabled={updatingId === b.id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                {updatingId === b.id ? '...' : 'Odobri'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Aktivni biznisi ({active.length})</h2>
        <div className="space-y-3">
          {active.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div>
                <p className="font-bold text-white">{b.name}</p>
                <p className="text-xs text-slate-400">{b.category} • {b.city} • {b.phone}</p>
                <p className="text-xs text-slate-500">{b.owner_email}</p>
              </div>
              <button
                onClick={() => updateStatus(b.id, 'pending')}
                disabled={updatingId === b.id}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-slate-300 text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                Suspenduj
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}