'use client';

import { useState, useEffect } from 'react';
import Icon from '../_components/icons';
import { ACCENTS, DEFAULT_THEME, loadTheme, saveTheme, type Surface, type ThemeSettings } from '../_lib/theme';

const SURFACES: { value: Surface; label: string; text: string; bg: string; card: string }[] = [
  { value: 'midnight', label: 'Ponoćna', text: 'Tamnoplava, kao POSLO ONE', bg: '#04060c', card: '#0a0e18' },
  { value: 'graphite', label: 'Grafit', text: 'Neutralna, skoro crna', bg: '#09090b', card: '#131316' },
];

// Izgled panela: samo boja i pozadina. Promjena se vidi odmah, bez dugmeta "Sačuvaj".
export default function AppearancePage() {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(loadTheme());
  }, []);

  const update = (partial: Partial<ThemeSettings>) => {
    const next = { ...theme, ...partial };
    setTheme(next);
    saveTheme(next);
  };

  const current = ACCENTS.find((a) => a.hex.toLowerCase() === theme.accent.toLowerCase());

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Izgled panela</h2>
        <p className="mt-1 text-sm text-slate-400">Izaberite boju i pozadinu. Panel se mijenja odmah, samo za vas, i pamti se na ovom uređaju.</p>
      </div>

      <section className="rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)]" aria-labelledby="boja">
        <div className="flex items-center justify-between gap-3">
          <h3 id="boja" className="text-base font-semibold text-white">Boja</h3>
          <span className="text-xs text-slate-400">{current ? current.name : 'Vlastita boja'}</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {ACCENTS.map((accent) => {
            const selected = theme.accent.toLowerCase() === accent.hex.toLowerCase();
            return (
              <button
                key={accent.hex}
                type="button"
                onClick={() => update({ accent: accent.hex })}
                aria-label={accent.name}
                aria-pressed={selected}
                className="group flex flex-col items-center gap-2"
              >
                <span
                  className={`flex aspect-square w-full max-w-14 items-center justify-center rounded-2xl transition duration-200 ${selected ? 'scale-105 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'group-hover:scale-105'}`}
                  style={{ backgroundColor: accent.hex, boxShadow: selected ? `0 10px 30px ${accent.hex}66` : undefined }}
                >
                  {selected && <Icon name="check" className="h-5 w-5 text-white" />}
                </span>
                <span className={`text-[11px] ${selected ? 'font-semibold text-white' : 'text-slate-400'}`}>{accent.name}</span>
              </button>
            );
          })}
          <label className="group flex cursor-pointer flex-col items-center gap-2">
            <span
              className={`relative flex aspect-square w-full max-w-14 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 transition group-hover:scale-105 ${current ? '' : 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'}`}
              style={{ background: current ? 'conic-gradient(#ef4444, #f59e0b, #10b981, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)' : theme.accent }}
            >
              <input
                type="color"
                value={theme.accent}
                onChange={(event) => update({ accent: event.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Vlastita boja"
              />
            </span>
            <span className="text-[11px] text-slate-400">Vlastita</span>
          </label>
        </div>
      </section>

      <section className="rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)]" aria-labelledby="pozadina">
        <h3 id="pozadina" className="text-base font-semibold text-white">Pozadina</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SURFACES.map((s) => {
            const selected = theme.surface === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => update({ surface: s.value })}
                aria-pressed={selected}
                className={`flex items-center gap-4 rounded-[calc(var(--po-radius)*0.8)] border p-3 text-left transition ${selected ? 'border-blue-500/70 bg-blue-500/10 ring-1 ring-blue-500/30' : 'border-white/[0.08] hover:border-white/20'}`}
              >
                <span className="flex h-14 w-20 shrink-0 flex-col justify-end gap-1 rounded-xl p-2" style={{ background: s.bg, border: '1px solid rgba(255,255,255,.08)' }}>
                  <span className="h-2 w-10 rounded-full bg-blue-500" />
                  <span className="h-4 rounded-md" style={{ background: s.card }} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{s.label}</span>
                  <span className="block text-xs text-slate-400">{s.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => update({ ...DEFAULT_THEME })}
        className="text-xs font-medium text-slate-400 underline-offset-4 transition hover:text-white hover:underline"
      >
        Vrati početni izgled
      </button>
    </div>
  );
}
