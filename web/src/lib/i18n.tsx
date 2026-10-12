import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import ur from '../i18n/ur.json';

/** Interface language (F23). English keys are whole sentences with {placeholders}; Urdu is in ur.json. */
export type Lang = 'en' | 'ur';
const STRINGS = ur.strings as Record<string, string>;
const ERRORS = ur.errors as Record<string, string>;
const SUBJECTS = ur.subjects as Record<string, string>;

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const s = (lang === 'ur' && STRINGS[key]) || key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Like translate, but placeholders may be React nodes (for bold topics, links). */
export function translateRich(lang: Lang, key: string, vars: Record<string, ReactNode>): ReactNode {
  const s = (lang === 'ur' && STRINGS[key]) || key;
  return s.split(/(\{\w+\})/).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    return <Fragment key={i}>{m && m[1] in vars ? vars[m[1]] : part}</Fragment>;
  });
}

function loadUrduFont() {
  if (document.getElementById('ur-font')) return;
  const l = document.createElement('link');
  l.id = 'ur-font'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
  document.head.appendChild(l);
}
export { loadUrduFont };

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tr: (key: string, vars: Record<string, ReactNode>) => ReactNode;
  subj: (name: string) => string;
  err: (e: { code?: string; message?: string }) => string;
  locale: string | undefined;
}
const Ctx = createContext<I18n | null>(null);

function stored(): Lang {
  try { return localStorage.getItem('edusaas_lang') === 'ur' ? 'ur' : 'en'; } catch { return 'en'; }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(stored);
  useEffect(() => {
    const r = document.documentElement;
    r.lang = lang; r.dir = lang === 'ur' ? 'rtl' : 'ltr';
    if (lang === 'ur') loadUrduFont();
    try { localStorage.setItem('edusaas_lang', lang); } catch { /* ignore */ }
  }, [lang]);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const value = useMemo<I18n>(() => ({
    lang, setLang,
    t: (k, v) => translate(lang, k, v),
    tr: (k, v) => translateRich(lang, k, v),
    subj: (n) => (lang === 'ur' && SUBJECTS[n]) || n,
    err: (e) => (lang === 'ur' && e.code && ERRORS[e.code]) || e.message || '',
    locale: lang === 'ur' ? 'ur-PK' : undefined,
  }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
