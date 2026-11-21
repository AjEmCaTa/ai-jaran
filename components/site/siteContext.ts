'use client';

import { createContext, useContext } from 'react';

// Zajedničke akcije javnog dijela (kontakt forma, politika privatnosti).
export type SiteState = { openContact: (plan?: string) => void; openPrivacy: () => void };

export const SiteContext = createContext<SiteState>({ openContact: () => {}, openPrivacy: () => {} });
export const useSite = () => useContext(SiteContext);

export const GENERAL_SUBJECT = 'Opšta pitanja / Konsultacije';
