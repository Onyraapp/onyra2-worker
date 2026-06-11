// src/hooks/useLocale.js
'use client';
import { useState, useEffect } from 'react';
import { translations, fmtMoney } from '../lib/i18n/translations';

// Siempre exporta español por defecto para evitar problemas de SSR
const DEFAULT = translations['es'];

export function useLocale() {
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const lang = navigator.language || 'es';
    setLocale(lang.startsWith('pt') ? 'pt' : 'es');
  }, []);

  // Usa siempre el objeto completo — nunca undefined
  const t = translations[locale] || DEFAULT;
  const isPT = locale === 'pt';
  const fmt = (n) => fmtMoney(n, locale);

  return { t, locale, isPT, fmt };
}
