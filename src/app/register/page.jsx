// Troco - Register
'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '../../lib/supabase';
import { useI18n } from '../../hooks/useI18n';

const fields = [
  {
    section: 'Tu negocio',
    items: [
      { key: 'businessName', label: 'Nombre del negocio', type: 'text', placeholder: 'Ej: Bar El Toro' },
    ],
  },
  {
    section: 'Tu cuenta',
    items: [
      { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
      { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' },
    ],
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form, set] = useState({ businessName: '', email: '', password: '' });
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
  e.preventDefault();
  if (!acepto) { setError('Tenés que aceptar los términos'); return; }
  setLoading(true);
  setError('');
  try {
    const { registrarBar } = await import('../../lib/data');
    await registrarBar({
      nombreBar: form.businessName,
      nombre: form.businessName,
      email: form.email,
      password: form.password,
    });
    router.push('/');
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-[18px] bg-[#0F4C5C] flex items-center justify-center mb-3">
          <svg width="32" height="32" viewBox="220 70 240 240" xmlns="http://www.w3.org/2000/svg">
            <rect x="190" y="40" width="300" height="300" rx="66" fill="#0F4C5C"/>
            <rect x="225" y="110" width="230" height="15" rx="7" fill="#FFFFFF"/>
            <rect x="238" y="148" width="175" height="15" rx="7" fill="#7FFFD4"/>
            <rect x="231" y="186" width="205" height="15" rx="7" fill="#FFFFFF"/>
            <rect x="225" y="224" width="230" height="15" rx="7" fill="#7FFFD4"/>
            <rect x="248" y="258" width="145" height="12" rx="6" fill="#FFFFFF" opacity="0.35"/>
          </svg>
        </div>
        <span className="text-2xl font-bold text-t1 tracking-tight lowercase">troco</span>
        <span className="text-[11px] text-t3 mt-1 uppercase tracking-widest">registrá tu negocio</span>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-sm flex flex-col gap-3">
        {fields.map(section => (
          <div key={section.section}>
            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide px-1 mb-1.5">{section.section}</div>
            <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
              {section.items.map((f, i) => (
                <div key={f.key} className={`px-4 py-3 ${i < section.items.length - 1 ? 'border-b border-divider' : ''}`}>
                  <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">{f.label}</div>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => set({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    required
                    className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-500 text-sm px-1">{error}</p>}

        <div className="flex items-start gap-3 px-1">
          <input
            type="checkbox"
            id="acepto"
            checked={acepto}
            onChange={e => setAcepto(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-primary flex-shrink-0"
          />
          <label htmlFor="acepto" className="text-xs text-t3 leading-relaxed">
            Acepto los{' '}
            <a href="/terminos" className="text-primary underline">Términos y Condiciones</a>
            {' '}y la{' '}
            <a href="/privacidad" className="text-primary underline">Política de Privacidad</a>
            {'.'}
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[#0F4C5C] font-semibold text-white text-[15px] disabled:opacity-50 uppercase tracking-wide"
        >
          {loading ? '...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-sm text-t3 lowercase pb-4">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="text-primary font-medium">Iniciá sesión</a>
        </p>
      </form>
    </div>
  );
}
