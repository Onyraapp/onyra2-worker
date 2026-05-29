'use client';
import { I18nProvider } from '../context/I18nContext';

export function Providers({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
