import Link from 'next/link';
import type { ReactNode } from 'react';

// Zajednički izgled pravnih stranica (uslovi, privatnost, povrat novca).
export type LegalSection = { title: string; body: ReactNode };

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
  englishTitle,
  englishSections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
  englishTitle: string;
  englishSections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#030712] text-slate-300">
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:pt-16">
        <Link href="/" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
          POSLO ONE
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">Posljednja izmjena: {updated}</p>
        <div className="mt-6 text-[15px] leading-7">{intro}</div>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold text-white">{s.title}</h2>
              <div className="mt-2 space-y-3 text-[15px] leading-7">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-10" lang="en">
          <h2 className="text-2xl font-bold text-white">{englishTitle}</h2>
          <div className="mt-6 space-y-6">
            {englishSections.map((s) => (
              <section key={s.title}>
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <div className="mt-1.5 space-y-2 text-sm leading-6 text-slate-400">{s.body}</div>
              </section>
            ))}
          </div>
        </div>

        <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-slate-400">
          <Link href="/uslovi" className="hover:text-white">Uslovi korištenja</Link>
          <Link href="/privatnost" className="hover:text-white">Politika privatnosti</Link>
          <Link href="/povrat-novca" className="hover:text-white">Povrat novca i otkazivanje</Link>
          <Link href="/cjenovnik" className="hover:text-white">Cjenovnik</Link>
        </nav>
      </div>
    </main>
  );
}
