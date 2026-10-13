'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useBusiness } from '../_lib/business-context';
import PushToggle from '../_components/PushToggle';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  status: 'new' | 'handled';
  created_at: string;
};

const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Prijavite se ponovo.');
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token };
}

function InquiriesContent() {
  const { business } = useBusiness();
  const params = useSearchParams();
  const highlight = params.get('id');
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/inquiries', { headers: await authHeaders(), cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upite nije moguće učitati.');
      setItems(Array.isArray(result.inquiries) ? result.inquiries : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upite nije moguće učitati.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load, business.id]);

  useEffect(() => {
    if (!highlight || loading) return;
    document.getElementById(`inquiry-${highlight}`)?.scrollIntoView({ block: 'center' });
  }, [highlight, loading, items.length]);

  const setStatus = async (id: string, status: 'new' | 'handled') => {
    setUpdating(id);
    try {
      const response = await fetch('/api/dashboard/inquiries', {
        method: 'PATCH',
        headers: await authHeaders(),
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Izmjena nije uspjela.');
      setItems((current) => current.map((item) => (item.id === id ? result.inquiry : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Izmjena nije uspjela.');
    } finally {
      setUpdating('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Upiti</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upiti s javnog profila nisu rezervacije i ne ulaze u prihod ni statistiku.
        </p>
      </div>

      <PushToggle />

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {!loading && highlight && !items.some((item) => item.id === highlight) && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Traženi upit nije pronađen u firmi „{business.name}“. Ako ste obavijest primili za drugu firmu, prijavite se na njen račun.
        </p>
      )}

      {loading ? (
        <div className={`${panel} text-sm text-gray-400`}>Učitavanje upita…</div>
      ) : items.length === 0 ? (
        <div className={`${panel} text-sm text-gray-400`}>Još nema upita.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              id={`inquiry-${item.id}`}
              className={`${panel} ${highlight === item.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleString('bs-BA', { hour12: false })}
                    {item.service ? ` · ${item.service}` : ''}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === 'new' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {item.status === 'new' ? 'Novi' : 'Riješen'}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-200">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a href={`tel:${item.phone.replace(/[^\d+]/g, '')}`} className="min-h-11 rounded-xl border border-white/10 px-4 py-2.5 text-white">
                  Nazovi {item.phone}
                </a>
                {item.email && (
                  <a href={`mailto:${item.email}`} className="min-h-11 break-all rounded-xl border border-white/10 px-4 py-2.5 text-white">
                    {item.email}
                  </a>
                )}
                <button
                  type="button"
                  disabled={updating === item.id}
                  onClick={() => setStatus(item.id, item.status === 'new' ? 'handled' : 'new')}
                  className="min-h-11 rounded-xl bg-white/10 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {item.status === 'new' ? 'Označi riješenim' : 'Vrati u nove'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InquiriesPage() {
  return (
    <Suspense fallback={null}>
      <InquiriesContent />
    </Suspense>
  );
}
