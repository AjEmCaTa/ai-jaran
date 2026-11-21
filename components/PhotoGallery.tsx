'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Galerija na javnoj stranici firme: niz slika koji se lista prstom, svaka u svom formatu
// (uspravna, položena, kvadrat). Klik otvara sliku preko cijelog ekrana; strelice, prevlačenje i Esc.
export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((dir: number) => {
    setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, go]);

  if (!photos.length) return null;

  return (
    <section aria-label="Galerija" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-white">Galerija</h2>
        <span className="text-xs text-gray-500">{photos.length} {photos.length === 1 ? 'slika' : photos.length < 5 ? 'slike' : 'slika'}</span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" data-no-swipe>
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative h-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:h-64"
            aria-label={`Otvori sliku ${i + 1} od ${photos.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${name} – slika ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} className="h-full w-auto max-w-[85vw] object-cover transition duration-300 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Slika ${open + 1} od ${photos.length}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open]} alt={`${name} – slika ${open + 1}`} className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setOpen(null)} aria-label="Zatvori" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">×</button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Prethodna" className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex">‹</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Sljedeća" className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex">›</button>
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{open + 1} / {photos.length}</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
