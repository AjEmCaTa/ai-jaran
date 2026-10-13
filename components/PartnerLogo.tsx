'use client';

import { useState } from 'react';
import { PARTNER_LOGOS, partnerInitials } from '../utils/partnerLogos';

// Kružni okvir za logo firme (ne za logo platforme POSLO ONE). Slika se prilagođava
// okviru bez razvlačenja i odsijecanja (object-contain); bez slike prikazuju se inicijali.
export default function PartnerLogo({
  slug,
  name,
  className = 'h-16 w-16',
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const src = PARTNER_LOGOS[slug];
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/40 bg-[#d1cdcf] ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true" className="select-none bg-[#030712] text-sm font-bold text-amber-400 flex h-full w-full items-center justify-center">
          {partnerInitials(name)}
        </span>
      )}
    </div>
  );
}
