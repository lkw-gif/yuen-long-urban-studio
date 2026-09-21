'use client';
import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useState, type ReactNode, type ReactElement } from 'react';
import { translateText, type Language } from '@/lib/i18n';
import { sitePath } from '@/lib/site-path';

const LanguageContext = createContext<{language: Language; setLanguage: (value: Language) => void}>({language:'zh-Hant', setLanguage: () => {}});
const storageKey = 'urban-studio-language';
const pagePaths = ['/', '/concepts/', '/bridge-workshop/', '/3d-design/', '/district-design/'].map(sitePath);
const titles: Record<string, [string, string]> = {
  'district-design': ['街區設計 · 元朗街區', 'District Designer · Yuen Long District'],
  '3d-design': ['3D design · Tinkercad 住宅大樓教學', '3D design · Tinkercad Residential Tower Tutorial'],
  'bridge-workshop': ['香港天橋製作 · Urban Studio', 'Hong Kong Skybridge Workshop · Urban Studio'],
  concepts: ['概念模型 · Urban Studio', 'Concept Models · Urban Studio'],
  home: ['元朗街區 · Urban Studio', 'Yuen Long District · Urban Studio'],
};
export function LanguageProvider({children}: {children: ReactNode}) {
  const [language, update] = useState<Language>('zh-Hant');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const restore = () => {
      const query = new URLSearchParams(window.location.search).get('lang');
      let stored: string | null = null;
      try { stored = localStorage.getItem(storageKey); } catch { /* URL choice still works. */ }
      update(query === 'en' || query === 'zh-Hant' ? query : stored === 'en' ? 'en' : 'zh-Hant');
      setLoaded(true);
    };
    restore(); window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.lang = language;
    const page = Object.keys(titles).find(key => key !== 'home' && window.location.pathname.includes('/' + key)) ?? 'home';
    document.title = titles[page][language === 'en' ? 1 : 0];
    try { localStorage.setItem(storageKey, language); } catch { /* In-memory and URL fallback. */ }
  }, [language, loaded]);
  const setLanguage = (next: Language) => {
    update(next);
    const url = new URL(window.location.href); url.searchParams.set('lang', next);
    window.history.replaceState(window.history.state, '', url);
  };
  return <LanguageContext.Provider value={{language,setLanguage}}>{children}</LanguageContext.Provider>;
}

/** Translate React text and presentation props without mutating the DOM or remounting scenes. */
export function localizeTree(node: ReactNode, language: Language): ReactNode {
  if (typeof node === 'string') return translateText(node, language);
  if (Array.isArray(node)) return Children.map(node, child => localizeTree(child, language));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props['data-no-localize']) return node;
  const props: Record<string, unknown> = {};
  for (const name of ['title', 'alt', 'aria-label', 'aria-description', 'placeholder']) {
    if (typeof element.props[name] === 'string') props[name] = translateText(element.props[name] as string, language);
  }
  if (typeof element.props.href === 'string') {
    const [path] = element.props.href.split('?');
    if (pagePaths.some(page => page.replace(/\/$/, '') === path.replace(/\/$/, ''))) {
      const url = new URL(element.props.href, 'https://local.invalid');
      url.searchParams.set('lang', language);
      props.href = url.pathname + url.search + url.hash;
    }
  }
  if ('children' in element.props) props.children = localizeTree(element.props.children as ReactNode, language);
  return cloneElement(element, props);
}
export function Localized({children}: {children: ReactNode}) {
  const {language} = useContext(LanguageContext);
  return localizeTree(children, language);
}
export function useLanguage() { return useContext(LanguageContext).language; }
export function LanguageSwitcher() {
  const {language, setLanguage} = useContext(LanguageContext);
  return <label className="language-switcher" data-no-localize="true">
    <span className="sr-only">Language / 語言</span>
    <select aria-label="Language / 語言" value={language} onChange={event => setLanguage(event.target.value as Language)}>
      <option value="zh-Hant">繁體中文</option><option value="en">English</option>
    </select>
  </label>;
}
