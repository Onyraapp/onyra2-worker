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
    } catch (err) {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-[18px] bg-green/15 border border-green/30 flex items-center justify-center mb-3">
          <span className="text-2xl font-black text-greentext">⇡</span>
        </div>
        <span className="text-2xl font-black text-t1 tracking-tight">CajaBar</span>
        <span className="text-[11px] uppercase tracking-[0.1em] text-t3 mt-1">Control de caja para bares</span>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
        <div className="bg-surface rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-t3">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@bar.com" required
              className="bg-offset border border-white/10 rounded-xl px-3 py-3 text-t1 text-sm
                focus:outline-none focus:border-primary/50 placeholder:text-t3"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-t3">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="bg-offset border border-white/10 rounded-xl px-3 py-3 text-t1 text-sm
                focus:outline-none focus:border-primary/50 placeholder:text-t3"
            />
          </div>
          {error && <p className="text-xs text-redtext text-center">{error}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl bg-green font-bold text-[#07111e] text-sm
            disabled:opacity-40 active:scale-[0.98] transition-transform">
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
