'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLang } from './site/LangProvider';

// Na engleskom se prvo prikaže engleska verzija, a bosanski original ostaje ispod.
export default function LegalBody({ bosnian, english, englishTitle }: { bosnian: ReactNode; english: ReactNode; englishTitle: string }) {
  const { lang } = useLang();
  const en = lang === 'en';
  const englishBlock = (
    <div lang="en" className={en ? '' : 'mt-16 border-t border-white/10 pt-10'}>
      <h2 className={en ? 'text-3xl font-bold text-white' : 'text-2xl font-bold text-white'}>{englishTitle}</h2>
      <div className="mt-6 space-y-6">{english}</div>
    </div>
  );
  return (
    <>
      {en ? (
        <>
          <div className="mt-8">{englishBlock}</div>
          <div className="mt-16 border-t border-white/10 pt-10">
            <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Original (Bosnian). In case of any difference, this version applies.</p>
            {bosnian}
          </div>
        </>
      ) : (
        <>
          {bosnian}
          {englishBlock}
        </>
      )}
      <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-slate-400">
        <Link href="/uslovi" className="hover:text-white">{en ? 'Terms of use' : 'Uslovi korištenja'}</Link>
        <Link href="/privatnost" className="hover:text-white">{en ? 'Privacy policy' : 'Politika privatnosti'}</Link>
        <Link href="/povrat-novca" className="hover:text-white">{en ? 'Refunds and cancellation' : 'Povrat novca i otkazivanje'}</Link>
        <Link href="/cjenovnik" className="hover:text-white">{en ? 'Pricing' : 'Cjenovnik'}</Link>
      </nav>
    </>
  );
}
