'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { initialLang, saveLang, type Lang } from '../../utils/bookingText';

// Jezik javnog dijela stranice (bosanski / engleski). Dashboard ostaje na bosanskom.
type LangState = { lang: Lang; setLang: (lang: Lang) => void };

const LangContext = createContext<LangState>({ lang: 'bs', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bs');

  useEffect(() => {
    const detected = initialLang();
    setLangState(detected);
    document.documentElement.lang = detected;
    // Skripta u <head> sakrije sadržaj dok se ne odredi engleski, da ne bljesne bosanski.
    requestAnimationFrame(() => document.documentElement.classList.remove('lang-pending'));
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLang(next);
    document.documentElement.lang = next;
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

// Vrati tekstove za trenutni jezik: const t = useT({ bs: {...}, en: {...} }).
export function useT<T>(dict: { bs: T; en: T }): T {
  return dict[useContext(LangContext).lang];
}
