'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './site/LangProvider';

// Slike jedne usluge na javnoj stranici: listaju se prstom ili strelicama, tačkice pokazuju
// gdje ste, a klik otvara sliku preko cijelog ekrana. Slika koja se ne učita jednostavno nestane,
// a bez ijedne slike komponenta ne prikazuje ništa (kartica ostaje samo s tekstom).
export default function ServicePhotoCarousel({ photos, title }: { photos: string[]; title: string }) {
  const en = useLang().lang === 'en';
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const list = photos.filter((p) => !failed.has(p));
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const scrollTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const go = useCallback((dir: number) => {
    setOpen((i) => (i === null ? i : (i + dir + list.length) % list.length));
  }, [list.length]);

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

  if (!list.length) return null;
  const safeIndex = Math.min(index, list.length - 1);

  return (
    <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
      <div
        ref={track}
        data-no-swipe
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {list.map((src, i) => (
          <button key={src} type="button" onClick={() => setOpen(i)} className="relative h-full w-full shrink-0 snap-center bg-[#05080f]" aria-label={`${title}: otvori sliku ${i + 1} od ${list.length}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} – slika ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setFailed((prev) => new Set(prev).add(src))}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0f19] to-transparent" />
      {list.length > 1 && (
        <>
          <button type="button" onClick={() => scrollTo(Math.max(0, safeIndex - 1))} aria-label={en ? 'Previous photo' : 'Prethodna slika'} className={`absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white backdrop-blur transition hover:bg-black/70 sm:flex ${safeIndex === 0 ? 'opacity-0' : ''}`}>‹</button>
          <button type="button" onClick={() => scrollTo(Math.min(list.length - 1, safeIndex + 1))} aria-label={en ? 'Next photo' : 'Sljedeća slika'} className={`absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white backdrop-blur transition hover:bg-black/70 sm:flex ${safeIndex === list.length - 1 ? 'opacity-0' : ''}`}>›</button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {list.map((src, i) => (
              <button key={src} type="button" onClick={() => scrollTo(i)} aria-label={`Slika ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === safeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">{safeIndex + 1}/{list.length}</span>
        </>
      )}

      {open !== null && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title}: slika ${open + 1} od ${list.length}`}
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
          <img src={list[open]} alt={`${title} – slika ${open + 1}`} className="max-h-[86vh] max-w-[94vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <p className="absolute left-4 top-5 max-w-[70vw] truncate text-sm font-semibold text-white">{title}</p>
          <button type="button" onClick={() => setOpen(null)} aria-label={en ? 'Close' : 'Zatvori'} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">×</button>
          {list.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={en ? 'Previous' : 'Prethodna'} className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex">‹</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={en ? 'Next' : 'Sljedeća'} className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex">›</button>
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{open + 1} / {list.length}</p>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
