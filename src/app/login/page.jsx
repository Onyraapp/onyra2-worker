// src/app/login/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../lib/data';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-[20px] bg-green flex items-center justify-center shadow-md mb-4">
          <span className="text-white text-2xl font-bold">C</span>
        </div>
        <span className="text-2xl font-bold text-t1 tracking-tight"> CajaSmart</span>
        <span className="text-sm text-t3 mt-1">Control de caja para bares</span>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-3">
        <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-divider">
            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@bar.com" required
              className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">Contraseña</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
          </div>
        </div>

        {error && <p className="text-sm text-redtext text-center">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl bg-green font-semibold text-white text-[15px] shadow-sm disabled:opacity-40 active:scale-[0.98] transition-all">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-center text-sm text-t3">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-primary font-medium">Registrá tu bar</Link>
        </p>
      </form>
    </div>
  );
}
