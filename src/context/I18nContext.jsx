'use client';
import { createContext, useState, useEffect, useCallback } from 'react';
import { translations, countryToLocale, defaultLocale, supportedLocales } from '../lib/i18n/translations';

export const I18nContext = createContext(null);

const STORAGE_KEY = 'troco_locale';

async function detectLocaleByIP() {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error('ipapi error');
    const data = await res.json();
    const country = data?.country_code;
    return countryToLocale[country] ?? defaultLocale;
  } catch {
    return defaultLocale;
  }
}

function resolve(obj, key) {
  return key.split('.').reduce((acc, k) => acc?.[k], obj) ?? key;
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(defaultLocale);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null;
      if (stored && supportedLocales.includes(stored)) {
        setLocaleState(stored);
        setLoading(false);
        return;
      }
      const detected = await detectLocaleByIP();
      setLocaleState(detected);
      setLoading(false);
    }
    init();
  }, []);

  const setLocale = useCallback((newLocale) => {
    if (!supportedLocales.includes(newLocale)) return;
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);

  const t = useCallback((key, forceLang) => {
    const lang = forceLang && supportedLocales.includes(forceLang) ? forceLang : locale;
    const dict = translations[lang] ?? translations[defaultLocale];
    return resolve(dict, key);
  }, [locale]);

  const formatCurrency = useCallback((amount, currency = 'ARS') => {
    const localeMap = { es: 'es-AR', pt: 'pt-BR', en: 'en-US' };
    try {
      return new Intl.NumberFormat(localeMap[locale] ?? 'es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }, [locale]);

  const formatDate = useCallback((date) => {
    const localeMap = { es: 'es-AR', pt: 'pt-BR', en: 'en-US' };
    try {
      return new Intl.DateTimeFormat(localeMap[locale] ?? 'es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(date));
    } catch {
      return String(date);
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatCurrency, formatDate, loading, supportedLocales }}>
      {children}
    </I18nContext.Provider>
  );
}
