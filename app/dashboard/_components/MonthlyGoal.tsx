'use client';

import { useEffect, useState } from 'react';
import Icon from './icons';

const STORAGE_KEY = 'poslo-monthly-goal';
const fmt = (n: number) => `${n.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;

export default function MonthlyGoal({ revenue, loading }: { revenue: number; loading: boolean }) {
  const [goal, setGoal] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(STORAGE_KEY));
      if (Number.isFinite(saved) && saved > 0) setGoal(saved);
    } catch {
      /* privatni mod */
    }
  }, []);

  const save = () => {
    const value = Number(draft.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) return;
    setGoal(value);
    setEditing(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* privatni mod */
    }
  };

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const pct = goal > 0 ? Math.min(100, Math.round((revenue / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - revenue);

  return (
    <section
      className="min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur"
      aria-label="Mjesečni cilj"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Icon name="target" className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Mjesečni cilj</h3>
        </div>
        {goal > 0 && !editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(String(goal));
              setEditing(true);
            }}
            className="text-xs font-medium text-slate-400 hover:text-white"
          >
            Promijeni
          </button>
        )}
      </div>

      {editing || goal === 0 ? (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            Koliko KM prihoda želite ovaj mjesec?
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && save()}
              placeholder="npr. 2000"
              className="mt-2 w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            />
          </label>
          <button
            type="button"
            onClick={save}
            disabled={!draft.trim()}
            className="rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
          >
            Postavi cilj
          </button>
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold tabular-nums text-white">
            {loading ? '...' : fmt(revenue)}
            <span className="ml-2 text-sm font-medium text-slate-400">od {fmt(goal)}</span>
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {pct >= 100
              ? 'Cilj je ostvaren. Čestitamo!'
              : `${pct}% ostvareno. Do cilja fali ${fmt(remaining)}, a do kraja mjeseca ${daysLeft} ${daysLeft === 1 ? 'dan' : 'dana'}.`}
          </p>
        </div>
      )}
    </section>
  );
}