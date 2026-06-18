// src/hooks/useLocale.js
'use client';
import { useI18n } from './useI18n';
import { translations, fmtMoney } from '../lib/i18n/translations';

export function useLocale() {
  const { locale, setLocale } = useI18n();
  const t = translations[locale] || translations['es'];
  const isPT = locale === 'pt';
  const fmt = (n) => fmtMoney(n, locale);
  return { t, locale, setLocale, isPT, fmt };
}
