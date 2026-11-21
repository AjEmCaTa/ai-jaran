'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LangProvider } from './LangProvider';
import Navbar from '../Navbar';
import Background from '../Background';
import ContactModal from '../ContactModal';
import PrivacyModal from '../PrivacyModal';
import CookieBanner from '../CookieBanner';

import { GENERAL_SUBJECT, SiteContext } from './siteContext';

// Meni, pozadina i kontakt žive ovdje, iznad stranica, pa se ne učitavaju ponovo pri svakom prelazu.

const hasChrome = (path: string) =>
  path === '/' || path === '/cjenovnik' || path === '/demo' || path === '/katalog' || path.startsWith('/katalog/');

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
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
        {chrome && <Navbar />}
        {children}
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} defaultSubject={subject} />
        <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        {chrome && <CookieBanner onOpenPrivacy={openPrivacy} />}
      </SiteContext.Provider>
    </LangProvider>
  );
}
