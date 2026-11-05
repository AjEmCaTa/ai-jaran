'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Icon from '../_components/icons';
import {
  ACCENTS,
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  type Density,
  type Radius,
  type Surface,
  type ThemeSettings,
} from '../_lib/theme';

const panel =
  'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-300">{label}</p>
      <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${value === option.value ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, text }: { icon: 'palette' | 'building'; title: string; text: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}

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

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Izgled panela</h2>
        <p className="mt-1 text-sm text-slate-400">Boja, pozadina i raspored. Mijenja samo kako vi vidite panel.</p>
      </div>

      {/* IZGLED */}
      <section className={panel} aria-label="Izgled">
        <SectionTitle icon="palette" title="Izgled" text="Promjene se primjenjuju odmah i pamte se u ovom pregledniku." />

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium text-slate-300">Boja panela</p>
              <div className="flex flex-wrap items-center gap-3">
                {ACCENTS.map((accent) => {
                  const selected = theme.accent.toLowerCase() === accent.hex.toLowerCase();
                  return (
                    <button
                      key={accent.hex}
                      type="button"
                      onClick={() => update({ accent: accent.hex })}
                      aria-label={accent.name}
                      aria-pressed={selected}
                      title={accent.name}
                      className={`h-9 w-9 rounded-full transition ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                      style={{ backgroundColor: accent.hex }}
                    />
                  );
                })}
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-xs text-slate-300 hover:border-blue-500/40">
                  <input
                    type="color"
                    value={theme.accent}
                    onChange={(event) => update({ accent: event.target.value })}
                    className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    aria-label="Vlastita boja"
                  />
                  Vlastita
                </label>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Segmented<Surface>
                label="Pozadina"
                value={theme.surface}
                onChange={(surface) => update({ surface })}
                options={[{ value: 'midnight', label: 'Ponoćna' }, { value: 'graphite', label: 'Grafit' }]}
              />
              <Segmented<Density>
                label="Razmak"
                value={theme.density}
                onChange={(density) => update({ density })}
                options={[{ value: 'compact', label: 'Kompaktno' }, { value: 'comfortable', label: 'Udobno' }]}
              />
              <div className="sm:col-span-2">
                <Segmented<Radius>
                  label="Zaobljenost kartica"
                  value={theme.radius}
                  onChange={(radius) => update({ radius })}
                  options={[{ value: 'sharp', label: 'Oštro' }, { value: 'soft', label: 'Meko' }, { value: 'round', label: 'Zaobljeno' }]}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => update(DEFAULT_THEME)}
              className="text-xs font-medium text-slate-400 underline-offset-4 transition hover:text-white hover:underline"
            >
              Vrati početni izgled
            </button>
          </div>

          {/* Pregled uživo */}
          <div
            className="rounded-[var(--po-radius)] border border-blue-500/20 p-[var(--po-pad)]"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-blue-500) 22%, var(--color-gray-900)), var(--color-gray-900) 70%)' }}
            aria-hidden="true"
          >
            <p className="text-xs text-slate-400">Pregled</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-white">12</p>
            <p className="text-xs text-slate-400">rezervacija ovaj mjesec</p>
            <div className="mt-4 flex h-16 items-end gap-1.5">
              {[35, 55, 40, 75, 60, 90, 70].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-md ${i === 6 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-blue-500/30'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mt-4 inline-flex rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white">Dugme</div>
          </div>
        </div>
      </section>

    </div>
  );
}
