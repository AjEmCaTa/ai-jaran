'use client';

import { useEffect, useRef, useState } from 'react';

// Broj koji se "odbroji" do vrijednosti (kratko, ~0.9 s). Bez animacije ako korisnik smanjuje pokrete.
export default function CountUp({ value, format = (n: number) => String(Math.round(n)), duration = 900 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (reduce || !Number.isFinite(value) || start === value) {
      setShown(value);
      from.current = value;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  // Cijeli brojevi se ne prikazuju s decimalama dok se broje.
  const isInt = Number.isInteger(value);
  return <span className="tabular-nums">{format(isInt ? Math.round(shown) : shown)}</span>;
}
