'use client';

import { useEffect, useState } from 'react';

// Drži element prisutnim dok traje animacija izlaska: [postoji, vidljiv].
export function useMountTransition(open: boolean, ms = 250): [boolean, boolean] {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(timer);
  }, [open, ms]);

  return [mounted, shown];
}
