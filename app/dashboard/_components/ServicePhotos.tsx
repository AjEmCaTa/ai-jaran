'use client';

import { useState } from 'react';
import { shrinkImage } from '../_lib/imageUpload';

export type ServicePhoto = { name: string; url: string };

// Slike jedne usluge u panelu: niz sličica, dodavanje više slika odjednom, brisanje i "prva".
export default function ServicePhotos({
  serviceId, photos, max, token, onChange,
}: {
  serviceId: string;
  photos: ServicePhoto[];
  max: number;
  token: () => Promise<string>;
  onChange: (photos: ServicePhoto[]) => void;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const list = Array.from(files).slice(0, Math.max(0, max - photos.length));
    if (!list.length) {
      setError(`Najviše ${max} slika po usluzi.`);
      return;
    }
    for (let i = 0; i < list.length; i += 1) {
      setBusy(list.length > 1 ? `Dodajem ${i + 1}/${list.length}` : 'Dodajem...');
      try {
        const blob = await shrinkImage(list[i]);
        const form = new FormData();
        form.append('serviceId', serviceId);
        form.append('photo', blob, 'photo');
        const res = await fetch('/api/dashboard/service-photos', { method: 'POST', headers: { Authorization: await token() }, body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || 'Slika nije sačuvana.');
          break;
        }
        onChange(json.photos || []);
      } catch {
        setError(`Sliku „${list[i].name}” nije moguće otvoriti. Probajte JPG ili PNG.`);
      }
    }
    setBusy('');
  };

  const act = async (photo: ServicePhoto, action: 'delete' | 'first') => {
    if (action === 'delete' && !window.confirm('Obrisati ovu sliku?')) return;
    setError('');
    setBusy(action === 'delete' ? 'Brišem...' : 'Premještam...');
    try {
      const res = action === 'delete'
        ? await fetch(`/api/dashboard/service-photos?name=${encodeURIComponent(photo.name)}`, { method: 'DELETE', headers: { Authorization: await token() } })
        : await fetch('/api/dashboard/service-photos', { method: 'PATCH', headers: { Authorization: await token(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name: photo.name }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || 'Nije uspjelo.');
      else onChange(json.photos || []);
    } catch {
      setError('Nije uspjelo. Pokušajte ponovo.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mt-3 w-full">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" data-no-swipe>
        {photos.map((p, i) => (
          <div key={p.name} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gray-950 sm:h-24 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Slika ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-blue-500 px-1.5 text-[9px] font-bold text-white">Prva</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/85 to-transparent p-1">
              {i > 0 ? (
                <button type="button" disabled={!!busy} onClick={() => void act(p, 'first')} aria-label={`Postavi sliku ${i + 1} kao prvu`} className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50">↑ Prva</button>
              ) : <span />}
              <button type="button" disabled={!!busy} onClick={() => void act(p, 'delete')} aria-label={`Obriši sliku ${i + 1}`} className="rounded bg-red-500/90 px-1.5 py-1 text-[10px] font-bold text-white disabled:opacity-50">✕</button>
            </div>
          </div>
        ))}
        <label className={`flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-center text-[10px] font-semibold text-slate-400 transition hover:border-blue-500/50 hover:text-blue-300 sm:h-24 sm:w-24 ${busy || photos.length >= max ? 'pointer-events-none opacity-50' : ''}`}>
          <span className="text-xl leading-none">+</span>
          {busy || (photos.length ? 'Dodaj još' : 'Dodaj slike')}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
        </label>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
