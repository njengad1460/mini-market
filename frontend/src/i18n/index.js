import { create } from 'zustand';
import en from './en.json';
import sw from './sw.json';

const translations = { en, sw };

const useI18n = create((set, get) => ({
  lang: localStorage.getItem('lang') || 'en',

  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  },

  t: (key) => {
    const { lang } = get();
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) val = val?.[k];
    return val || key;
  },
}));

export default useI18n;
