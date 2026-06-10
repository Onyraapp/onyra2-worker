// src/hooks/useLocale.js
'use client';
import { useState, useEffect } from 'react';
import { translations, fmtMoney } from '../lib/i18n';

export function useLocale() {
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const lang = navigator.language || navigator.userLanguage || 'es';
    setLocale(lang.startsWith('pt') ? 'pt' : 'es');
  }, []);

  const t = translations[locale];
  const isPT = locale === 'pt';
  const fmt = (n) => fmtMoney(n, locale);

  return { t, locale, isPT, fmt };
}
