'use client';

import { useState } from 'react';
import { PARTNER_LOGOS, partnerInitials } from '../utils/partnerLogos';

// Logo firme prikazan onakav kakav je (bez okvira i pozadine, bez odsijecanja).
// Bez slike prikazuju se inicijali.
export default function PartnerLogo({
  slug,
  name,
  className = 'h-16 w-16',
  src: customSrc,
}: {
  slug: string;
  name: string;
  className?: string;
  src?: string;
}) {
  const src = customSrc || PARTNER_LOGOS[slug];
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${showImage ? '' : 'bg-white/[0.06]'} ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true" className="flex h-full w-full select-none items-center justify-center text-sm font-bold text-slate-200">
          {partnerInitials(name)}
        </span>
      )}
    </div>
  );
}
