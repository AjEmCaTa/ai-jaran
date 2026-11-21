'use client';

import { useEffect, useState } from 'react';
import { shrinkImage } from '../_lib/imageUpload';

// Naslovna slika javne stranice: vidi se iza naziva firme, gore čista, a prema tekstu se zatamni.
export default function CoverManager({ token, name, slug }: { token: () => Promise<string>; name: string; slug?: string | null }) {
  const [cover, setCover] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch('/api/dashboard/cover', { headers: { Authorization: await token() }, cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (alive && res.ok) setCover(json.cover?.url || '');
      } catch {
        // bez naslovne
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setBusy('Čuvam...');
    try {
      const blob = await shrinkImage(file, 2200);
      const form = new FormData();
      form.append('photo', blob, 'cover');
      const res = await fetch('/api/dashboard/cover', { method: 'POST', headers: { Authorization: await token() }, body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || 'Slika nije sačuvana.');
      else setCover(json.cover?.url || '');
    } catch {
      setError('Ovu sliku nije moguće otvoriti. Probajte JPG ili PNG.');
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    if (!window.confirm('Ukloniti naslovnu sliku?')) return;
    setBusy('Uklanjam...');
    try {
      const res = await fetch('/api/dashboard/cover', { method: 'DELETE', headers: { Authorization: await token() } });
      if (res.ok) setCover('');
      else setError('Slika nije uklonjena.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70" aria-labelledby="naslovna-naslov">
      <div className="relative h-44 sm:h-56">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/40 to-gray-950" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-gray-900 to-gray-950" />
        )}
        <div className="absolute inset-x-0 bottom-0 p-[var(--po-pad)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Pregled</p>
          <p className="truncate text-2xl font-black text-white drop-shadow">{name || 'Vaša firma'}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-[var(--po-pad)]">
        <div className="min-w-0">
          <h3 id="naslovna-naslov" className="font-semibold text-white">Naslovna slika stranice</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Vidi se na vrhu vaše javne stranice{slug ? ` /katalog/${slug}` : ''}, iza naziva firme. Najljepše izgleda položena slika (npr. prostor, apartman, salon).
          </p>
          {error && <p role="alert" className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
        <div className="flex gap-2">
          <label className={`inline-flex min-h-10 cursor-pointer items-center rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400 ${busy || !loaded ? 'pointer-events-none opacity-50' : ''}`}>
            {busy || (cover ? 'Promijeni' : 'Dodaj naslovnu')}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {cover && (
            <button type="button" disabled={!!busy} onClick={() => void remove()} className="min-h-10 rounded-[calc(var(--po-radius)*0.7)] border border-white/10 px-3 text-sm font-semibold text-slate-300 hover:border-red-500/40 hover:text-red-300 disabled:opacity-50">
              Ukloni
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
