'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './icons';

type Item = {
  id: string;
  customer_name: string | null;
  service_name: string | null;
  reservation_date: string | null;
  created_at?: string | null;
};

const SEEN_KEY = 'poslo-last-seen';

export default function NotificationBell({ getToken }: { getToken: () => Promise<string | null> }) {
  const [items, setItems] = useState<Item[]>([]);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Prvi put: počni brojati od sada, da novi nalog ne dobije "lavinu" starih obavijesti
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SEEN_KEY);
      if (raw) {
        setLastSeen(Number(raw));
      } else {
        const now = Date.now();
        window.localStorage.setItem(SEEN_KEY, String(now));
        setLastSeen(now);
      }
    } catch {
      setLastSeen(Date.now());
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/dashboard/reservations', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const result = await response.json();
      setItems((result.reservations || []).slice(0, 30));
    } catch {
      /* tiha greška: zvonce nije kritično */
    }
  }, [getToken]);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isNew = (item: Item) =>
    lastSeen !== null && Boolean(item.created_at) && new Date(item.created_at as string).getTime() > lastSeen;
  const newCount = items.filter(isNew).length;

  const markSeen = () => {
    const now = Date.now();
    setLastSeen(now);
    try {
      window.localStorage.setItem(SEEN_KEY, String(now));
    } catch {
      /* privatni mod */
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          load();
        }}
        aria-label={newCount > 0 ? `Obavijesti: ${newCount} novih` : 'Obavijesti'}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] text-gray-300 transition hover:border-blue-500/40 hover:text-white"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {newCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[var(--po-radius)] border border-white/10 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <p className="text-sm font-semibold text-white">Nove rezervacije</p>
            {newCount > 0 && (
              <button type="button" onClick={markSeen} className="text-xs font-medium text-blue-400 hover:text-blue-300">
                Označi kao viđeno
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-500">Još nema rezervacija.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-white/[0.05] overflow-y-auto">
              {items.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link
                    href="/dashboard/reservations"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04]"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew(item) ? 'bg-blue-400' : 'bg-transparent'}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{item.customer_name || 'Klijent'}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {item.service_name || 'Usluga'}
                        {item.reservation_date && ` · ${new Date(item.reservation_date).toLocaleString('bs-BA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/dashboard/reservations"
            onClick={() => setOpen(false)}
            className="block border-t border-white/[0.06] px-4 py-3 text-center text-xs font-medium text-blue-400 hover:bg-white/[0.04]"
          >
            Sve rezervacije
          </Link>
        </div>
      )}
    </div>
  );
}