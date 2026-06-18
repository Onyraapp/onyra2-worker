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
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
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
