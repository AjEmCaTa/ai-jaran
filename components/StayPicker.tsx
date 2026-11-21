'use client';

import { useMemo, useState } from 'react';
import { nightsBetween, stayIsFree } from '../utils/stay';
import type { BookingText } from '../utils/bookingText';

// Kalendar boravka: prvi dodir = dolazak, drugi = odlazak. Zauzete i zaključane noći se ne mogu
// uzeti, a dan kad neko odlazi može biti dan dolaska novog gosta (odjava 10h, prijava poslije).
export default function StayPicker({
  t, occupied, closed, checkIn, checkOut, onChange, disabled, checkInAt, checkOutAt, pricePerNight, priceOnRequest,
}: {
  t: BookingText;
  occupied: Set<string>;
  closed: string[];
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  disabled: boolean;
  checkInAt: string;
  checkOutAt: string;
  pricePerNight: number | null;
  priceOnRequest: boolean;
}) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const closedSet = useMemo(() => new Set(closed), [closed]);

  const shift = (d: number) => {
    const m = month + d;
    setYear(year + Math.floor(m / 12));
    setMonth(((m % 12) + 12) % 12);
  };

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const fmt = (d: string) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}.` : '—');
  const nightFree = (d: string) => !occupied.has(d) && !closedSet.has(d);

  const pick = (d: string) => {
    if (disabled || d < today) return;
    if (!checkIn || checkOut || d <= checkIn) {
      if (nightFree(d)) onChange(d, '');
      return;
    }
    if (stayIsFree(checkIn, d, occupied, closed)) onChange(checkIn, d);
    else if (nightFree(d)) onChange(d, '');
  };

  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const canPrev = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  return (
    <div className={`space-y-5 rounded-3xl border border-white/10 bg-[#0b0f19] p-6 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-3 ${checkIn && !checkOut ? 'border-blue-500/60' : 'border-white/10'} bg-[#030712]`}>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">{t.checkIn}</span>
          <span className="block text-sm font-bold text-white">{fmt(checkIn)}</span>
          <span className="block text-[10px] text-gray-500">{t.checkInFrom} {checkInAt}</span>
        </div>
        <div className={`rounded-2xl border p-3 ${checkIn && !checkOut ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]' : 'border-white/10'} bg-[#030712]`}>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">{t.checkOut}</span>
          <span className="block text-sm font-bold text-white">{fmt(checkOut)}</span>
          <span className="block text-[10px] text-gray-500">{t.checkOutUntil} {checkOutAt}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className="rounded-lg bg-[#030712] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-30" aria-label={t.days[0] === 'Mon' ? 'Previous month' : 'Prethodni mjesec'}>◀</button>
        <span className="text-sm font-bold text-white">{t.months[month]} {year}</span>
        <button type="button" onClick={() => shift(1)} className="rounded-lg bg-[#030712] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600" aria-label={t.days[0] === 'Mon' ? 'Next month' : 'Sljedeći mjesec'}>▶</button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center">
          {t.days.map((d) => <span key={d} className="text-[11px] font-bold uppercase text-gray-500">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: count }).map((_, i) => {
            const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
            const past = d < today;
            const inRange = checkIn && checkOut && d > checkIn && d < checkOut;
            const isEdge = d === checkIn || d === checkOut;
            const asCheckout = !!checkIn && !checkOut && d > checkIn && stayIsFree(checkIn, d, occupied, closed);
            const blocked = past || (!nightFree(d) && !asCheckout);
            return (
              <button
                key={d}
                type="button"
                disabled={blocked}
                onClick={() => pick(d)}
                aria-pressed={isEdge}
                className={`relative h-10 rounded-xl text-xs font-bold transition ${
                  isEdge
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : inRange
                      ? 'bg-blue-500/20 text-blue-100'
                      : blocked
                        ? 'cursor-not-allowed text-gray-600 line-through opacity-40'
                        : 'border border-white/10 bg-[#030712] text-gray-300 hover:border-blue-500/50'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs">
        <span className="text-gray-400">{!checkIn ? t.pickCheckIn : !checkOut ? t.pickCheckOut : t.nights(nights)}</span>
        {nights > 0 && (
          <span className="font-bold text-white">
            {t.stayTotal}: <span className="text-blue-400">{priceOnRequest || pricePerNight === null ? t.priceOnRequest : `${(pricePerNight * nights).toLocaleString('bs-BA')} KM`}</span>
          </span>
        )}
        {checkIn && (
          <button type="button" onClick={() => onChange('', '')} className="text-[11px] font-semibold text-gray-400 underline hover:text-white">{t.clearDates}</button>
        )}
      </div>
    </div>
  );
}

