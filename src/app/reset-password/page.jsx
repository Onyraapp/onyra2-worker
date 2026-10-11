'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getClient();
    sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Las contrasenas no coinciden'); return; }
    if (password.length < 6) { setError('Minimo 6 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const sb = getClient();
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleLabel = showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena';

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-10">
        <img src="/logo.svg" alt="Troco" className="w-24 h-24 mb-3" />
      </div>
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-t1">Nueva contrasena</div>
          <div className="text-sm text-t3 mt-1">Ingresa tu nueva contrasena</div>
        </div>
        {done ? (
          <div className="bg-greensoft rounded-2xl p-5 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-semibold text-greentext">Contrasena actualizada</div>
            <div className="text-xs text-t3 mt-1">Redirigiendo...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-divider">
                <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">Nueva contrasena</div>
                <div className="flex items-center gap-2">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres" required
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
              <div className="px-4 py-3">
                <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">Confirmar contrasena</div>
                <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeti la contrasena" required
                  className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
              </div>
            </div>
            {error && <p className="text-sm text-redtext px-1">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0F4C5C] font-semibold text-white text-[15px] disabled:opacity-50 uppercase tracking-wide">
              {loading ? '...' : 'Guardar contrasena'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-t3">
          <a href="/login" className="text-primary font-medium">Volver al inicio de sesion</a>
        </p>
      </div>
    </div>
  );
}
