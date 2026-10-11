'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/data';
import { useI18n } from '../../hooks/useI18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale, loading: localeLoading } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  }

  if (localeLoading) return null;

  const toggleLabel = showPassword
    ? (locale === 'pt' ? 'Ocultar senha' : 'Ocultar contraseña')
    : (locale === 'pt' ? 'Mostrar senha' : 'Mostrar contraseña');

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setLocale('es')}
          className={"px-2 py-1 rounded-lg text-xs font-semibold border transition-all " + (locale === 'es' ? 'bg-primary text-white border-primary' : 'bg-surface text-t3 border-divider')}>
          🇦🇷 ES
        </button>
        <button onClick={() => setLocale('pt')}
          className={"px-2 py-1 rounded-lg text-xs font-semibold border transition-all " + (locale === 'pt' ? 'bg-primary text-white border-primary' : 'bg-surface text-t3 border-divider')}>
          🇧🇷 PT
        </button>
      </div>
      <div className="flex flex-col items-center mb-10">
        <img src="/logo.svg" alt="Troco" className="w-24 h-24 mb-3" />
        <span className="text-[11px] text-t3 mt-1 uppercase tracking-widest">{t('appTagline')}</span>
      </div>
      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-3">
        <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-divider">
            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">{t('auth.email')}</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@bar.com" required
              className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">{t('auth.password')}</div>
            <div className="flex items-center gap-2">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                aria-label={toggleLabel} title={toggleLabel}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-t3 active:scale-95 transition-all">
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-redtext text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl bg-[#0F4C5C] font-semibold text-white text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all uppercase tracking-wide">
          {loading ? '...' : t('auth.login')}
        </button>
        <p className="text-center text-sm text-t3 mb-1"><a href='/forgot-password' className='text-primary font-medium'>{locale === 'pt' ? 'Esqueceu sua senha?' : '¿Olvidaste tu contraseña?'}</a></p>
        <p className="text-center text-sm text-t3 lowercase">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="text-primary font-medium">{t('auth.register')}</Link>
        </p>
      </form>
    </div>
  );
}
