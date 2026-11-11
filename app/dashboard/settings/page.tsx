'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useBusiness } from '../_lib/business-context';
import Icon from '../_components/icons';
import TimeInput24 from '../_components/TimeInput24';
import PartnerLogo from '../../../components/PartnerLogo';
import { CATALOG_CATEGORIES, categoryOf } from '../../../utils/catalog';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

const panel =
  'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';
const inputClass =
  'mt-2 w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

function SectionTitle({ icon, title, text }: { icon: 'palette' | 'building' | 'star' | 'calendar'; title: string; text: ReactNode }) {
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

// Bilo koja slika se u pregledniku smanji (najviše 1200 px) i pretvori u WEBP/PNG,
// pa veličina originala nije bitna. Prozirnost se zadržava.
async function prepareLogo(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    const w = img.naturalWidth || 1200;
    const h = img.naturalHeight || 1200;
    const scale = Math.min(1, 1200 / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92));
    if (blob) return blob;
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (png) return png;
    throw new Error('encode');
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Raspon datuma (uključivo) kao lista 'YYYY-MM-DD'.
function dateRange(from: string, to: string) {
  const out: string[] = [];
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${(to || from)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;
  for (const d = new Date(start); d <= end && out.length < 120; d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}
const prettyDate = (key: string) => {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y}.`;
};

export default function SettingsPage() {
  const { business: ctxBusiness, ownerName: ctxOwnerName, refresh } = useBusiness();
  const [business, setBusiness] = useState({ id: '', name: '', city: '', category: '', phone: '', owner_email: '', address: '', work_start: '', work_end: '', work_days: [] as string[], google_review_url: '', rebook_weeks: null as number | null, closed_dates: [] as string[] });
  const [newClosed, setNewClosed] = useState('');
  const [closedTo, setClosedTo] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoMessage, setLogoMessage] = useState('');
  const locked = ctxBusiness.plan === 'starter';

  const changeLogo = async (file: File | null) => {
    setLogoMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLogoMessage('Prijavite se ponovo.');
      return;
    }
    setLogoBusy(true);
    try {
      let response: Response;
      if (file) {
        let upload: Blob;
        try {
          upload = await prepareLogo(file);
        } catch {
          setLogoMessage('Ovu sliku nije moguće otvoriti. Pokušajte s drugom slikom (npr. PNG ili JPG).');
          return;
        }
        const form = new FormData();
        form.append('logo', upload, 'logo');
        response = await fetch('/api/dashboard/logo', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      } else {
        response = await fetch('/api/dashboard/logo', { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } });
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setLogoMessage(result.error || 'Logo nije sačuvan.');
      else {
        setLogoMessage(file ? 'Logo je sačuvan.' : 'Logo je uklonjen.');
        await refresh();
      }
    } finally {
      setLogoBusy(false);
    }
  };
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Podaci dolaze iz zajedničkog konteksta layouta (bez ponovnog dohvaćanja).
  useEffect(() => {
    setBusiness({
      id: ctxBusiness.id,
      name: ctxBusiness.name,
      city: ctxBusiness.city,
      category: ctxBusiness.category,
      phone: ctxBusiness.phone,
      owner_email: ctxBusiness.owner_email,
      address: ctxBusiness.address,
      work_start: ctxBusiness.work_start,
      work_end: ctxBusiness.work_end,
      work_days: ctxBusiness.work_days,
      google_review_url: ctxBusiness.google_review_url,
      rebook_weeks: ctxBusiness.rebook_weeks,
      closed_dates: ctxBusiness.closed_dates,
    });
    setOwnerName(ctxOwnerName);
    setLoading(false);
  }, [ctxBusiness, ctxOwnerName]);

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
        owner_name: ownerName.trim() || undefined,
        city: business.city.trim() || null,
        category: categoryOf(business.category),
        phone: business.phone.trim() || null,
        owner_email: business.owner_email.trim() || null,
        address: business.address.trim() || null,
        work_start: business.work_start || null,
        work_end: business.work_end || null,
        work_days: business.work_days,
        google_review_url: business.google_review_url.trim() || null,
        rebook_weeks: business.rebook_weeks,
        closed_dates: business.closed_dates,
      }),
    });
    const result = await response.json();
    if (!response.ok) setErrorMessage(result.error || 'Promjene nije moguće sačuvati.');
    else {
      setSaveMessage('Podaci biznisa su sačuvani.');
      await refresh();
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Podaci o firmi</h2>
        <p className="mt-1 text-sm text-slate-400">Naziv, kontakt i radno vrijeme koje klijenti vide na vašoj stranici.</p>
      </div>

      {/* PODACI O BIZNISU */}
      <section className={panel} aria-label="Podaci o biznisu">
        <SectionTitle icon="building" title="Podaci o biznisu" text="Uređujete podatke povezane s vašim vlasničkim profilom." />

        {errorMessage && <p role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{errorMessage}</p>}

        <div className="mb-6 flex flex-col gap-4 rounded-[calc(var(--po-radius)*0.7)] bg-white/[0.03] p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
          <PartnerLogo slug={ctxBusiness.slug} name={business.name || 'Firma'} src={ctxBusiness.logo_url} className="h-16 w-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Logo firme</p>
            {logoMessage && <p role="status" className="mt-1.5 text-xs text-blue-300">{logoMessage}</p>}
          </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-500 px-4 text-xs font-semibold text-white transition hover:bg-blue-400 ${logoBusy ? 'pointer-events-none opacity-50' : ''}`}>
              <Icon name="download" className="h-4 w-4 rotate-180" />
              {logoBusy ? 'Čuvanje...' : ctxBusiness.logo_url ? 'Promijeni' : 'Dodaj logo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  e.target.value = '';
                  if (f) void changeLogo(f);
                }}
              />
            </label>
            {ctxBusiness.logo_url && (
              <button type="button" disabled={logoBusy} onClick={() => void changeLogo(null)} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-50">
                Ukloni
              </button>
            )}
          </div>
        </div>

        {locked && (
          <p className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
            Vaš paket je Starter: radno vrijeme, radne dane i zaključane dane za vas mijenja POSLO ONE. Javite nam izmjenu ili pređite na Pro paket da ih uređujete sami.
          </p>
        )}

        <form onSubmit={saveBusiness} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-300">
            Djelatnost (kategorija u katalogu)
            <select
              value={CATALOG_CATEGORIES.some((c) => c.slug === business.category) ? business.category : categoryOf(business.category)}
              onChange={(event) => setBusiness((current) => ({ ...current, category: event.target.value }))}
              className={inputClass}
            >
              {CATALOG_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.short}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-300">
            Ime i prezime vlasnika
            <input
              type="text"
              maxLength={100}
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </label>
          {([
            ['name', 'Naziv biznisa', 'text'],
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
          <fieldset disabled={locked} className={`grid gap-4 sm:col-span-2 sm:grid-cols-2 ${locked ? 'opacity-60' : ''}`}>
          <TimeInput24
            label="Početak radnog vremena"
            value={business.work_start.slice(0, 5)}
            onChange={(value) => setBusiness((current) => ({ ...current, work_start: value }))}
          />
          <TimeInput24
            label="Kraj radnog vremena"
            value={business.work_end.slice(0, 5)}
            onChange={(value) => setBusiness((current) => ({ ...current, work_end: value }))}
          />
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
          </fieldset>
          <div className="space-y-5 border-t border-white/[0.06] pt-6 sm:col-span-2">
            <SectionTitle icon="star" title="Više klijenata i recenzija" text="Automatski mailovi koji vam vraćaju klijente i donose recenzije." />
            <label className="block text-xs font-medium text-slate-300">
              Link za Google recenzije
              <input
                type="url"
                inputMode="url"
                placeholder="https://g.page/r/..."
                maxLength={500}
                value={business.google_review_url}
                onChange={(event) => setBusiness((current) => ({ ...current, google_review_url: event.target.value }))}
                className={inputClass}
              />
              <span className="mt-1.5 block text-[11px] font-normal leading-relaxed text-slate-500">
                Kad kliknete „Završi” na terminu, klijent dobije mail s molbom za recenziju. Link nađete u Google Business profilu pod „Zatražite recenzije”. Prazno = isključeno.
              </span>
            </label>
            <label className="block text-xs font-medium text-slate-300">
              Poziv klijentu da ponovo zakaže
              <select
                value={business.rebook_weeks ?? ''}
                onChange={(event) => setBusiness((current) => ({ ...current, rebook_weeks: event.target.value ? Number(event.target.value) : null }))}
                className={inputClass}
              >
                <option value="">Isključeno</option>
                {[2, 3, 4, 5, 6, 8, 10, 12, 26].map((w) => (
                  <option key={w} value={w}>{`${w} sedmica nakon posjete`}</option>
                ))}
              </select>
              <span className="mt-1.5 block text-[11px] font-normal leading-relaxed text-slate-500">
                Ako klijent od tada nije ništa zakazao, dobije mail „Vrijeme je za novi termin?” s linkom vaše stranice.
              </span>
            </label>
          </div>

          <fieldset disabled={locked} className={`space-y-4 border-t border-white/[0.06] pt-6 sm:col-span-2 ${locked ? 'opacity-60' : ''}`}>
            <SectionTitle icon="calendar" title="Pauza i godišnji odmor" text="Zaključani dani se klijentima ne nude za zakazivanje." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block text-xs font-medium text-slate-300">
                Od
                <DateField value={newClosed} onChange={setNewClosed} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-slate-300">
                Do (nije obavezno)
                <DateField value={closedTo} min={newClosed || undefined} onChange={setClosedTo} className={inputClass} />
              </label>
              <button
                type="button"
                disabled={!newClosed}
                onClick={() => {
                  const add = dateRange(newClosed, closedTo);
                  setBusiness((current) => ({ ...current, closed_dates: [...new Set([...current.closed_dates, ...add])].sort() }));
                  setNewClosed('');
                  setClosedTo('');
                }}
                className="min-h-11 rounded-[calc(var(--po-radius)*0.6)] border border-blue-500/40 px-4 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10 disabled:opacity-40"
              >
                Zaključaj
              </button>
            </div>
            {business.closed_dates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {business.closed_dates.map((day) => (
                  <span key={day} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 py-1 pl-3 pr-1 text-xs font-medium text-amber-200">
                    {prettyDate(day)}
                    <button
                      type="button"
                      aria-label={`Otključaj ${prettyDate(day)}`}
                      onClick={() => setBusiness((current) => ({ ...current, closed_dates: current.closed_dates.filter((d) => d !== day) }))}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-amber-300 hover:bg-amber-500/20"
                    >
                      <Icon name="close" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nema zaključanih dana.</p>
            )}
            <p className="text-[11px] text-slate-500">Promjene se primjenjuju kad kliknete „Sačuvaj podatke”.</p>
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

      <BookingConfirmCard />
    </div>
  );
}

// Potvrda termina: zasebna postavka koja se čuva odmah (važi samo za ovu firmu).
function BookingConfirmCard() {
  const { business, refresh } = useBusiness();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const choose = async (auto: boolean) => {
    if (auto === business.auto_confirm || busy) return;
    setBusy(true);
    setMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo.');
      const res = await fetch('/api/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ auto_confirm: auto }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Postavka nije sačuvana.');
      await refresh();
      setMsg(auto ? 'Novi termini se sad potvrđuju automatski.' : 'Novi termini sad čekaju vašu potvrdu.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Pokušajte ponovo.');
    } finally {
      setBusy(false);
    }
  };
  const options = [
    { auto: true, title: 'Automatski (preporučeno)', text: 'Klijent zakaže slobodan termin i odmah dobije potvrdu. Vi samo otkažete ili pomjerite ako treba.' },
    { auto: false, title: 'Ručno', text: 'Svaki novi termin čeka vašu potvrdu. Ako ga ne potvrdite u 24 sata, ističe.' },
  ];
  return (
    <section className="rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)]">
      <h3 className="text-base font-semibold text-white">Potvrda termina</h3>
      <p className="mt-1 text-sm text-slate-400">Šta se dešava kad klijent zakaže termin preko vašeg linka.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = business.auto_confirm === o.auto;
          return (
            <button
              key={o.title}
              type="button"
              onClick={() => void choose(o.auto)}
              disabled={busy}
              aria-pressed={active}
              className={`rounded-[calc(var(--po-radius)*0.8)] border p-4 text-left transition disabled:opacity-60 ${active ? 'border-blue-500/70 bg-blue-500/10 ring-1 ring-blue-500/30' : 'border-white/[0.08] hover:border-white/20'}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? 'border-blue-400' : 'border-slate-500'}`}>
                  {active && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                </span>
                {o.title}
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{o.text}</span>
            </button>
          );
        })}
      </div>
      {msg && <p role="status" className="mt-3 text-sm text-emerald-400">{msg}</p>}
    </section>
  );
}
// Polje za datum koje i na iPhoneu izgleda kako treba: ne izlazi iz kartice i prazno pokazuje uputu.
function DateField({ value, onChange, min, className }: { value: string; onChange: (v: string) => void; min?: string; className: string }) {
  const shown = value ? value.split('-').reverse().join('.') + '.' : '';
  return (
    <div className="relative mt-2">
      <div className={`${className} !mt-0 pointer-events-none flex min-h-11 items-center justify-between`} aria-hidden="true">
        <span className={value ? 'text-white' : 'text-slate-500'}>{shown || 'Izaberite datum'}</span>
        <Icon name="calendar" className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        aria-label={shown || 'Izaberite datum'}
        className="absolute inset-0 h-full w-full min-w-0 cursor-pointer appearance-none opacity-0"
      />
    </div>
  );
}
