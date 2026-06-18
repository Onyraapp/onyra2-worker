// src/hooks/useLocale.js
'use client';
import { useState, useEffect } from 'react';
import { translations, fmtMoney } from '../lib/i18n/translations';

const DEFAULT = translations['es'];
const STORAGE_KEY = 'troco_locale';

export function useLocale() {
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt' || stored === 'es') {
      setLocale(stored);
    } else {
      const lang = navigator.language || 'es';
      setLocale(lang.startsWith('pt') ? 'pt' : 'es');
    }
  }, []);

  const t = translations[locale] || DEFAULT;
  const isPT = locale === 'pt';
  const fmt = (n) => fmtMoney(n, locale);

  return { t, locale, isPT, fmt };
}
