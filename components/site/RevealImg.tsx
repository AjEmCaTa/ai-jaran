'use client';

import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

// Slika koja se lagano pojavi kad se učita, umjesto da naglo iskoči.
export default function RevealImg({ className = '', onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      ref={ref}
      {...props}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`img-reveal ${loaded ? 'is-loaded' : ''} ${className}`}
    />
  );
}
