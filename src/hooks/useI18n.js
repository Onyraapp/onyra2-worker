'use client';
import { useContext } from 'react';
import { I18nContext } from '../context/I18nContext';

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  }
  return context;
}
