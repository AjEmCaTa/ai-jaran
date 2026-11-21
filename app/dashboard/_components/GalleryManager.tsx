'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Galerija firme u panelu: dodavanje više slika odjednom (bilo koji format: uspravne, položene, kvadrat),
// brisanje i "postavi kao prvu". Slike se prije slanja smanje (najduža strana 1920 px), oblik ostaje isti.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Photo = { name: string; url: string };
const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';

async function token() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Prijavite se ponovo.');
  return `Bearer ${session.access_token}`;
}

async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    const w = img.naturalWidth || 1600;
    const h = img.naturalHeight || 1200;
    const scale = Math.min(1, 1920 / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.84));
    if (webp && webp.type === 'image/webp') return webp;
    const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
    if (jpg) return jpg;
    throw new Error('encode');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function GalleryManager({ slug }: { slug?: string | null }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [max, setMax] = useState(24);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/gallery', { headers: { Authorization: await token() }, cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setPhotos(json.photos || []);
        if (json.max) setMax(json.max);
      }
    } catch {
      // ostaje prazno
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setMessage('');
    const list = Array.from(files).slice(0, Math.max(0, max - photos.length));
    if (!list.length) {
      setError(`Najviše ${max} slika. Obrišite neku pa dodajte novu.`);
      return;
    }
    let ok = 0;
    for (let i = 0; i < list.length; i += 1) {
      setBusy(`Dodajem ${i + 1} od ${list.length}...`);
      try {
        const blob = await shrink(list[i]);
        const form = new FormData();
        form.append('photo', blob, 'photo');
        const res = await fetch('/api/dashboard/gallery', { method: 'POST', headers: { Authorization: await token() }, body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || 'Slika nije sačuvana.');
          break;
        }
        setPhotos(json.photos || []);
        ok += 1;
      } catch {
        setError(`Sliku „${list[i].name}” nije moguće otvoriti. Probajte JPG ili PNG.`);
      }
    }
    setBusy('');
    if (ok) setMessage(ok === 1 ? 'Slika je dodana.' : `Dodano slika: ${ok}.`);
  };

  const act = async (photo: Photo, action: 'delete' | 'first') => {
    if (action === 'delete' && !window.confirm('Obrisati ovu sliku?')) return;
    setError('');
    setMessage('');
    setBusy(action === 'delete' ? 'Brišem...' : 'Premještam...');
    try {
      const res = action === 'delete'
        ? await fetch(`/api/dashboard/gallery?name=${encodeURIComponent(photo.name)}`, { method: 'DELETE', headers: { Authorization: await token() } })
        : await fetch('/api/dashboard/gallery', { method: 'PATCH', headers: { Authorization: await token(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name: photo.name }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || 'Nije uspjelo.');
      else {
        setPhotos(json.photos || []);
        setMessage(action === 'delete' ? 'Slika je obrisana.' : 'Slika je sada prva (naslovna).');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nije uspjelo.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className={panel} aria-labelledby="galerija-naslov">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="galerija-naslov" className="text-lg font-semibold text-white">Galerija slika</h3>
          <p className="mt-1 text-sm text-slate-400">
            Slike prostora, soba, radova ili ekipe. Prikazuju se na vašoj javnoj stranici{slug ? ` /katalog/${slug}` : ''}, odmah ispod naziva. Bilo koji format: uspravne, položene ili kvadrat.
          </p>
        </div>
        <label className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400 ${busy || photos.length >= max ? 'pointer-events-none opacity-50' : ''}`}>
          + Dodaj slike
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
        </label>
      </div>

      {(busy || message || error) && (
        <p role="status" className={`mt-3 text-sm ${error ? 'text-red-300' : 'text-blue-300'}`}>{error || busy || message}</p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Učitavam...</p>
      ) : photos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
          Još nema slika. Dodajte nekoliko, prva slika je naslovna.
        </p>
      ) : (
        <>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.name} className="group relative overflow-hidden rounded-xl border border-white/10 bg-gray-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Slika ${i + 1}`} loading="lazy" className="aspect-square h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">Naslovna</span>}
                <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2">
                  {i > 0 && (
                    <button type="button" disabled={!!busy} onClick={() => void act(p, 'first')} className="min-h-9 flex-1 rounded-lg bg-white/15 px-2 text-[11px] font-semibold text-white backdrop-blur hover:bg-white/25 disabled:opacity-50">
                      Postavi prvu
                    </button>
                  )}
                  <button type="button" disabled={!!busy} onClick={() => void act(p, 'delete')} aria-label={`Obriši sliku ${i + 1}`} className="min-h-9 rounded-lg bg-red-500/80 px-3 text-[11px] font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                    Obriši
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">{photos.length} / {max} slika</p>
        </>
      )}
    </section>
  );
}
