'use client';
import { useState } from 'react';
import { getClient } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const sb = getClient();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.troco.lat/reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-10">
        <img src="/logo.svg" alt="Troco" className="w-24 h-24 mb-3" />
      </div>
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-t1">Recuperar contrasena</div>
          <div className="text-sm text-t3 mt-1">Te enviamos un link para resetearla</div>
        </div>
        {sent ? (
          <div className="bg-greensoft rounded-2xl p-5 text-center">
            <div className="text-2xl mb-2">📬</div>
            <div className="text-sm font-semibold text-greentext">Email enviado</div>
            <div className="text-xs text-t3 mt-1">Revisa tu bandeja de entrada y segui el link</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-3">
                <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">Email</div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" required
                  className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
              </div>
            </div>
            {error && <p className="text-sm text-redtext px-1">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0F4C5C] font-semibold text-white text-[15px] disabled:opacity-50 uppercase tracking-wide">
              {loading ? '...' : 'Enviar link'}
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
