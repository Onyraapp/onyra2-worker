'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/data';
import { useI18n } from '../../hooks/useI18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
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

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-[20px] bg-[#0F4C5C] flex items-center justify-center mb-3">
          <svg width="36" height="36" viewBox="190 40 300 300" xmlns="http://www.w3.org/2000/svg">
            <rect x="190" y="40" width="300" height="300" rx="66" fill="#0F4C5C"/>
            <rect x="255" y="100" width="170" height="13" rx="6.5" fill="#FFFFFF"/>
            <rect x="265" y="140" width="130" height="13" rx="6.5" fill="#7FFFD4"/>
            <rect x="260" y="180" width="150" height="13" rx="6.5" fill="#FFFFFF"/>
            <rect x="255" y="220" width="170" height="13" rx="6.5" fill="#7FFFD4"/>
            <rect x="270" y="260" width="110" height="13" rx="6.5" fill="#FFFFFF" opacity="0.35"/>
          </svg>
        </div>
        <span className="text-2xl font-bold text-t1 tracking-tight lowercase">troco</span>
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
        <p className="text-center text-sm text-t3 lowercase">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="text-primary font-medium">{t('auth.register')}</Link>
        </p>
      </form>
    </div>
  );
}
