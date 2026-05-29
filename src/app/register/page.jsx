// src/app/register/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registrarBar } from '../../lib/data';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreBar: '', nombre: '', email: '', password: '', confirm: '' });
  const [acepto,  setAcepto]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister(e) {
    e.preventDefault();
    if (!acepto) return setError('Debés aceptar los términos para continuar');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setError(''); setLoading(true);
    try {
      await registrarBar(form);
      router.push('/onboarding');
    } catch (err) {
      setError(err.message || 'Error al registrar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { section: 'Tu negocio', items: [
      { label: 'Nombre del negocio', key: 'nombreBar', type: 'text', placeholder: 'Ej: Bar El Gaucho' },
    ]},
    { section: 'Tu cuenta (Admin)', items: [
      { label: 'Tu nombre',           key: 'nombre',   type: 'text',     placeholder: 'Ej: Juan Pérez' },
      { label: 'Email',               key: 'email',    type: 'email',    placeholder: 'tu@email.com' },
      { label: 'Contraseña',          key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
      { label: 'Confirmar contraseña', key: 'confirm', type: 'password', placeholder: '••••••••' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center shadow-md mb-4">
          <span className="text-white text-2xl font-bold">B</span>
        </div>
        <span className="text-2xl font-bold text-t1 tracking-tight">Burra</span>
        <span className="text-sm text-t3 mt-1">Registrá tu negocio</span>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-sm flex flex-col gap-3">
        {fields.map(section => (
          <div key={section.section}>
            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide px-1 mb-1.5">{section.section}</div>
            <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
              {section.items.map((f, i) => (
                <div key={f.key} className={`px-4 py-3 ${i < section.items.length - 1 ? 'border-b border-divider' : ''}`}>
                  <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} required
                    className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-start gap-3 px-1">
          <input type="checkbox" id="acepto" checked={acepto} onChange={e => setAcepto(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0" />
          <label htmlFor="acepto" className="text-xs text-t3 leading-relaxed">
           Acepto los{' '}
          <a href="/terminos" className="text-primary underline">Términos y Condiciones</a>
          {' '}y{' '}
          <a href="/privacidad" className="text-primary underline">Política de Privacidad</a>
          {'.'}
        </label>
      </div>

      <button
        type="submit"
        className="w-full bg-accent text-white py-3 rounded-2xl font-semibold text-[15px] mt-2"
      >
        Crear cuenta
      </button>
    </form>
  );
}
