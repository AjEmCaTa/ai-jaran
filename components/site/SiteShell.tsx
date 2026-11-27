'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LangProvider } from './LangProvider';
import Navbar from '../Navbar';
import Background from '../Background';
import ContactModal from '../ContactModal';
import PrivacyModal from '../PrivacyModal';
import CookieBanner from '../CookieBanner';
import AppChrome from '../app/AppChrome';

import { GENERAL_SUBJECT, SiteContext } from './siteContext';

// Meni, pozadina i kontakt žive ovdje, iznad stranica, pa se ne učitavaju ponovo pri svakom prelazu.

// U aplikaciji: vlastito zaglavlje i donja traka svuda osim panela (on ima svoju traku) i početnog ekrana.
const hasAppChrome = (path: string) => !path.startsWith('/dashboard') && !path.startsWith('/master-panel') && path !== '/app';

const hasChrome = (path: string) =>
  path === '/' || path === '/cjenovnik' || path === '/demo' || path === '/za-firme' || path === '/o-nama' || path === '/faq' || path === '/profil' || path === '/katalog' || path.startsWith('/katalog/');

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  // Sigurnosna mreža: ako React ili Safari (vraćanje stranice iz keša) skine klase app-ui/app-mode s <html>,
  // ponovo ih postavi pri svakoj promjeni stranice i kad se stranica vrati iz pozadine.
  useEffect(() => {
    const apply = () => (window as unknown as { __posloApplyMode?: () => void }).__posloApplyMode?.();
    apply();
    window.addEventListener('pageshow', apply);
    document.addEventListener('visibilitychange', apply);
    return () => {
      window.removeEventListener('pageshow', apply);
      document.removeEventListener('visibilitychange', apply);
    };
  }, [pathname]);
  const chrome = hasChrome(pathname);
  const [contactOpen, setContactOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [subject, setSubject] = useState(GENERAL_SUBJECT);

  const openContact = useCallback((plan: string = GENERAL_SUBJECT) => {
    setSubject(plan);
    setContactOpen(true);
  }, []);
  const openPrivacy = useCallback(() => setPrivacyOpen(true), []);

  return (
    <LangProvider>
      <SiteContext.Provider value={{ openContact, openPrivacy }}>
        {chrome && <Background />}
        {chrome && <div className="web-only"><Navbar /></div>}
        {!chrome && hasAppChrome(pathname) && <div aria-hidden className="app-only h-[calc(3.5rem+env(safe-area-inset-top))]" />}
        {children}
        {hasAppChrome(pathname) && <AppChrome />}
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} defaultSubject={subject} />
        <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        {chrome && <CookieBanner onOpenPrivacy={openPrivacy} />}
      </SiteContext.Provider>
    </LangProvider>
  );
}
