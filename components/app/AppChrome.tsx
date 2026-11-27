'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon, { type IconName } from '../Icon';
import { useLang, useT } from '../site/LangProvider';
import { useSite } from '../site/siteContext';

// Zaglavlje i donja traka koji se vide SAMO u aplikaciji (html.app-mode, klasa app-only).
// Na web stranici ovaj dio je skriven, a stranica izgleda kao i do sada.

const TEXT = {
  bs: {
    home: 'Početna', bookings: 'Moji termini', more: 'Više', back: 'Nazad',
    panel: 'Moj panel', panelSub: 'Za vlasnike firmi', business: 'Za firme', about: 'O nama', faq: 'Česta pitanja',
    contact: 'Kontakt', privacy: 'Privatnost', terms: 'Uslovi korištenja', language: 'Jezik', close: 'Zatvori',
  },
  en: {
    home: 'Home', bookings: 'My bookings', more: 'More', back: 'Back',
    panel: 'My panel', panelSub: 'For business owners', business: 'For businesses', about: 'About', faq: 'FAQ',
    contact: 'Contact', privacy: 'Privacy', terms: 'Terms of use', language: 'Language', close: 'Close',
  },
};

const ROOT_TABS = ['/', '/nalog'];

export default function AppChrome() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const t = useT(TEXT);
  const { lang, setLang } = useLang();
  const { openContact } = useSite();
  const [sheet, setSheet] = useState(false);

  useEffect(() => setSheet(false), [pathname]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const isRoot = ROOT_TABS.includes(pathname);
  const goBack = () => (window.history.length > 1 ? router.back() : router.push('/'));

  const tabs: { key: string; href?: string; label: string; icon: IconName; active: boolean; onClick?: () => void }[] = [
    { key: 'home', href: '/', label: t.home, icon: 'home', active: pathname === '/' || pathname.startsWith('/katalog') },
    { key: 'bookings', href: '/nalog', label: t.bookings, icon: 'calendar', active: pathname === '/nalog' },
    { key: 'more', label: t.more, icon: 'grid', active: sheet, onClick: () => setSheet((v) => !v) },
  ];

  const links: { href: string; label: string; icon: IconName; sub?: string }[] = [
    { href: '/dashboard', label: t.panel, sub: t.panelSub, icon: 'dashboard' },
    { href: '/za-firme', label: t.business, icon: 'building' },
    { href: '/o-nama', label: t.about, icon: 'users' },
    { href: '/faq', label: t.faq, icon: 'message' },
    { href: '/privatnost', label: t.privacy, icon: 'shield' },
    { href: '/uslovi', label: t.terms, icon: 'check' },
  ];

  return (
    <div className="app-only">
      {/* Zaglavlje */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#030712]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3">
          {isRoot ? (
            <Link href="/" className="flex items-center gap-2 pl-1">
              <Image src="/poslo.one.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" priority />
              <span className="text-[17px] font-extrabold tracking-tight text-white">POSLO ONE</span>
            </Link>
          ) : (
            <>
              <button onClick={goBack} aria-label={t.back} className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/5">
                <Icon name="back" className="h-6 w-6" />
              </button>
              <Image src="/poslo.one.png" alt="" width={26} height={26} className="h-[26px] w-[26px]" priority />
              <span className="text-[16px] font-extrabold tracking-tight text-white">POSLO ONE</span>
            </>
          )}
        </div>
      </header>

      {/* Prostor da donja traka ne prekrije kraj stranice */}
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))]" />

      {/* Donja traka */}
      <nav aria-label="Aplikacija" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#060a16]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="grid h-16 grid-cols-3">
          {tabs.map((tab) => {
            const inner = (
              <>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 ${tab.active ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400'}`}>
                  <Icon name={tab.icon} className="h-[22px] w-[22px]" />
                </span>
                <span className={`text-[11px] font-semibold ${tab.active ? 'text-white' : 'text-slate-400'}`}>{tab.label}</span>
              </>
            );
            const cls = 'app-press flex flex-col items-center justify-center gap-0.5';
            return tab.href ? (
              <Link key={tab.key} href={tab.href} className={cls} aria-current={tab.active ? 'page' : undefined}>{inner}</Link>
            ) : (
              <button key={tab.key} onClick={tab.onClick} className={cls} aria-expanded={sheet}>{inner}</button>
            );
          })}
        </div>
      </nav>

      {/* Meni "Više" odozdo */}
      {sheet && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40" role="dialog" aria-modal="true" aria-label={t.more}>
          <button aria-label={t.close} onClick={() => setSheet(false)} className="app-fade absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="app-sheet absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#0a0f1e] px-4 pb-4 pt-3">
            <div className="mb-3 flex items-center justify-between pl-2">
              <span className="text-lg font-extrabold text-white">{t.more}</span>
              <button onClick={() => setSheet(false)} aria-label={t.close} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-slate-300 hover:bg-white/10">
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="app-press flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/[0.04]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-blue-300"><Icon name={l.icon} className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-white">{l.label}</span>
                    {l.sub && <span className="block text-xs text-slate-400">{l.sub}</span>}
                  </span>
                </Link>
              ))}
              <button onClick={() => { setSheet(false); openContact(); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/[0.04]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-blue-300"><Icon name="mail" className="h-5 w-5" /></span>
                <span className="text-[15px] font-semibold text-white">{t.contact}</span>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <span className="text-sm font-semibold text-slate-300">{t.language}</span>
              <div className="flex rounded-xl bg-white/[0.05] p-1 text-xs font-bold">
                {(['bs', 'en'] as const).map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`h-8 w-11 rounded-lg ${lang === l ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{l.toUpperCase()}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
