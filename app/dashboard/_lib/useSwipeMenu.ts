"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Mobilni meni koji se otvara povlačenjem prsta s lijeve strane udesno i zatvara povlačenjem ulijevo.
// Meni prati prst (koliko povučeš, toliko se otvori). Ne smeta horizontalnom listanju (tabla, tabovi)
// ni poljima za unos. Napomena: sam rub ekrana na iPhoneu/Androidu u pregledniku zauzima telefon
// (gest "nazad"), pa povlačenje radi od malo unutar ekrana; u instaliranoj aplikaciji radi i s ruba.
export function useSwipeMenu(open: boolean, setOpen: (v: boolean) => void, drawerRef: RefObject<HTMLElement | null>) {
  const [dragX, setDragX] = useState<number | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    let sx = 0, sy = 0, st = 0, width = 300;
    let mode: "open" | "close" | null = null;
    let locked = false;
    let last = 0;

    const scrollsSideways = (el: Element | null) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        if (n.matches("input, textarea, select, [data-no-swipe], [draggable='true']")) return true;
        const cs = getComputedStyle(n);
        if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 2) return true;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (window.innerWidth >= 768 || e.touches.length !== 1) return;
      const t = e.touches[0];
      const target = e.target as Element | null;
      if (target?.closest("input, textarea, select")) return;
      width = drawerRef.current?.offsetWidth || 300;
      if (openRef.current) {
        mode = "close";
      } else {
        if (t.clientX > window.innerWidth * 0.45 || scrollsSideways(target)) return;
        mode = "open";
      }
      sx = t.clientX; sy = t.clientY; st = performance.now(); locked = false; last = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!mode) return;
      const t = e.touches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (!locked) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { mode = null; return; }
        if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        if ((mode === "open" && dx < 0) || (mode === "close" && dx > 0)) { mode = null; return; }
        locked = true;
      }
      last = dx;
      const x = mode === "open" ? Math.min(width, Math.max(0, dx)) : Math.min(width, Math.max(0, width + dx));
      setDragX(x);
    };

    const onEnd = () => {
      if (!mode) return;
      if (locked) {
        const v = last / Math.max(1, performance.now() - st); // px/ms
        if (mode === "open") setOpen(last > width * 0.33 || v > 0.45);
        else setOpen(!(last < -width * 0.33 || v < -0.45));
      }
      mode = null;
      locked = false;
      setDragX(null);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [setOpen, drawerRef]);

  return dragX;
}
