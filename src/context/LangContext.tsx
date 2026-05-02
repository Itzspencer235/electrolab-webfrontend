'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Lang } from '@/lib/constants';

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; dir: 'ltr' | 'rtl'; }
const Ctx = createContext<LangCtx>({ lang: 'fr', setLang: () => {}, dir: 'ltr' });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l;
      document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr';
    }
  };
  return (
    <Ctx.Provider value={{ lang, setLang, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);