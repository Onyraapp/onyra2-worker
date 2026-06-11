// src/hooks/useLocale.js
'use client';
import { useState, useEffect } from 'react';
import { translations, fmtMoney } from '../lib/i18n/translations';

export function useLocale() {
  const [locale, setLocale] = useState('es');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const lang = navigator.language || 'es';
    setLocale(lang.startsWith('pt') ? 'pt' : 'es');
    setHydrated(true);
  }, []);

  const t = translations[hydrated ? locale : 'es'];
  const isPT = hydrated && locale === 'pt';
  const fmt = (n) => fmtMoney(n, hydrated ? locale : 'es');

  return { t, locale, isPT, fmt };
}
