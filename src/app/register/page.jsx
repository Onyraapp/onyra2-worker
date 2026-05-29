'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '../../lib/supabase';

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
      const supabase = getClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { business_name: form.businessName } },
      });
      if (signUpError) throw signUpError;
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-white text-2xl font-bold">T</span>
          <span className="text-2xl font-bold text-t1 tracking-tight">Troco</span>
        </div>
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
          className="w-full bg-accent text-white py-3 rounded-2xl font-semibold text-[15px] mt-2 disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
