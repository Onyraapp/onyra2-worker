// src/app/register/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registrarBar } from '../../lib/data';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreBar: '', nombre: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setError(''); setLoading(true);
    try {
      await registrarBar(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al registrar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-t3">{label}</label>
      <input
        type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder} required
        className="bg-offset border border-white/10 rounded-xl px-3 py-3 text-t1 text-sm
          focus:outline-none focus:border-primary/50 placeholder:text-t3"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-[18px] bg-green/15 border border-green/30 flex items-center justify-center mb-3">
          <span className="text-2xl font-black text-greentext">⇡</span>
        </div>
        <span className="text-2xl font-black text-t1 tracking-tight">CajaBar</span>
        <span className="text-xs text-t3 mt-1">Registrá tu bar</span>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-sm flex flex-col gap-4">
        <div className="bg-surface rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
          <div className="text-xs font-semibold text-t2 pb-1 border-b border-white/[0.08]">Datos del bar</div>
          {field('Nombre del bar', 'nombreBar', 'text', 'Ej: Bar El Gaucho')}

          <div className="text-xs font-semibold text-t2 pb-1 border-b border-white/[0.08] mt-2">Tu cuenta (Admin)</div>
          {field('Tu nombre', 'nombre', 'text', 'Ej: Juan Pérez')}
          {field('Email', 'email', 'email', 'tu@email.com')}
          {field('Contraseña', 'password', 'password', 'Mínimo 6 caracteres')}
          {field('Confirmar contraseña', 'confirm', 'password', '••••••••')}

          {error && <p className="text-xs text-redtext text-center">{error}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl bg-green font-bold text-[#07111e] text-sm
            disabled:opacity-40 active:scale-[0.98] transition-transform">
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-sm text-t3">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-primary font-medium">Ingresar</Link>
        </p>
      </form>
    </div>
  );
}
