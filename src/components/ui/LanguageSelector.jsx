'use client';
import { useI18n } from '../hooks/useI18n';

const FLAG_LABELS = {
  es: { flag: '🇦🇷', label: 'Español' },
  pt: { flag: '🇧🇷', label: 'Português' },
  en: { flag: '🇺🇸', label: 'English' },
};

export function LanguageSelector({ className = '' }) {
  const { locale, setLocale, supportedLocales } = useI18n();

  return (
    <div className={`flex gap-2 ${className}`}>
      {supportedLocales.map((lang) => {
        const { flag, label } = FLAG_LABELS[lang];
        const isActive = locale === lang;
        return (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            title={label}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-150
              ${isActive
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <span>{flag}</span>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{lang.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
