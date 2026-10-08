'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

const panel =
  'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';
const inputClass =
  'mt-2 w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

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

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [business, setBusiness] = useState({ id: '', name: '', city: '', category: '', phone: '', owner_email: '', address: '', work_start: '', work_end: '', work_days: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setTheme(loadTheme());

    async function loadBusiness() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Prijavite se ponovo za pristup postavkama.');
        const response = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const dashboard = await response.json();
        if (!response.ok) throw new Error(dashboard.error || 'Podatke nije moguće učitati.');
        const b = dashboard.business;
        setBusiness({
          id: b.id || '',
          name: b.name || '',
          city: b.city || '',
          category: b.category || '',
          phone: b.phone || '',
          owner_email: b.owner_email || '',
          address: b.address || '',
          work_start: b.work_start || '',
          work_end: b.work_end || '',
          work_days: Array.isArray(b.work_days) ? b.work_days : [],
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Podatke nije moguće učitati.');
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, []);

  const update = (partial: Partial<ThemeSettings>) => {
    const next = { ...theme, ...partial };
    setTheme(next);
    saveTheme(next);
  };

  const saveBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveMessage('');
    setErrorMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMessage('Prijavite se ponovo da biste sačuvali izmjene.');
      setSaving(false);
      return;
    }
    const response = await fetch('/api/dashboard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        name: business.name.trim(),
        city: business.city.trim() || null,
        category: business.category.trim() || null,
        phone: business.phone.trim() || null,
        owner_email: business.owner_email.trim() || null,
        address: business.address.trim() || null,
        work_start: business.work_start || null,
        work_end: business.work_end || null,
        work_days: business.work_days,
      }),
    });
    const result = await response.json();
    if (!response.ok) setErrorMessage(result.error || 'Promjene nije moguće sačuvati.');
    else setSaveMessage('Podaci biznisa su sačuvani.');
    setSaving(false);
  };

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Postavke</h2>
        <p className="mt-1 text-sm text-slate-400">Prilagodite izgled panela i uredite podatke o biznisu.</p>
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

      {/* PODACI O BIZNISU */}
      <section className={panel} aria-label="Podaci o biznisu">
        <SectionTitle icon="building" title="Podaci o biznisu" text="Uređujete podatke povezane s vašim vlasničkim profilom." />

        {errorMessage && <p role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{errorMessage}</p>}

        <form onSubmit={saveBusiness} className="grid gap-4 sm:grid-cols-2">
          {([
            ['name', 'Naziv biznisa', 'text'],
            ['category', 'Djelatnost', 'text'],
            ['city', 'Grad / lokacija', 'text'],
            ['phone', 'Telefon', 'tel'],
            ['owner_email', 'Email biznisa', 'email'],
            ['address', 'Adresa', 'text'],
          ] as const).map(([field, label, type]) => (
            <label key={field} className="block text-xs font-medium text-slate-300">
              {label}
              <input
                required={field === 'name'}
                type={type}
                value={business[field]}
                onChange={(event) => setBusiness((current) => ({ ...current, [field]: event.target.value }))}
                className={inputClass}
              />
            </label>
          ))}
          <label className="block text-xs font-medium text-slate-300">
            Početak radnog vremena
            <input type="time" value={business.work_start.slice(0, 5)} onChange={(event) => setBusiness((current) => ({ ...current, work_start: event.target.value }))} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-slate-300">
            Kraj radnog vremena
            <input type="time" value={business.work_end.slice(0, 5)} onChange={(event) => setBusiness((current) => ({ ...current, work_end: event.target.value }))} className={inputClass} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-medium text-slate-300">Radni dani</legend>
            <div className="flex flex-wrap gap-2">
              {['Pon', 'Uto', 'Sri', 'Cet', 'Pet', 'Sub', 'Ned'].map((day) => (
                <label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-500/40">
                  <input
                    type="checkbox"
                    checked={business.work_days.includes(day)}
                    onChange={(event) =>
                      setBusiness((current) => ({
                        ...current,
                        work_days: event.target.checked ? [...current.work_days, day] : current.work_days.filter((item) => item !== day),
                      }))
                    }
                    className="accent-blue-500"
                  />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving || loading || !business.id}
              className="rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj podatke'}
            </button>
            {saveMessage && <p role="status" className="text-sm text-emerald-400">{saveMessage}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}