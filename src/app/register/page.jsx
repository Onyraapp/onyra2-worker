// Troco - Register
'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../hooks/useI18n';

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale, loading: localeLoading } = useI18n();
  const isPT = locale === 'pt';
  const [form, set] = useState({ businessName: '', email: '', password: '' });
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (localeLoading) return null;

  const fields = [
    {
      section: isPT ? 'Seu negócio' : 'Tu negocio',
      items: [
        { key: 'businessName', label: isPT ? 'Nome do negócio' : 'Nombre del negocio', type: 'text', placeholder: isPT ? 'Ex: Bar do João' : 'Ej: Bar El Toro' },
      ],
    },
    {
      section: isPT ? 'Sua conta' : 'Tu cuenta',
      items: [
        { key: 'email', label: t('auth.email'), type: 'email', placeholder: isPT ? 'voce@email.com' : 'tu@email.com' },
        { key: 'password', label: t('auth.password'), type: 'password', placeholder: isPT ? 'Mínimo 6 caracteres' : 'Mínimo 6 caracteres' },
      ],
    },
  ];

  async function handleRegister(e) {
    e.preventDefault();
    if (!acepto) { setError(isPT ? 'Você precisa aceitar os termos' : 'Tenés que aceptar los términos'); return; }
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
      if (err.message?.includes('duplicate') || err.message?.includes('already registered')) {
        setError(isPT ? 'Este e-mail já tem uma conta registrada. Faça login ou use outro e-mail.' : 'Este email ya tiene una cuenta registrada. Iniciá sesión o usá otro email.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <img src="/logo.svg" alt="Troco" className="w-24 h-24 mb-3" />
        <span translate="no" className="font-neonize text-2xl text-t1 tracking-tight lowercase">troco</span>
        <span className="text-[11px] text-t3 mt-1 uppercase tracking-widest">{isPT ? 'cadastre seu negócio' : 'registrá tu negocio'}</span>
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
            {isPT ? 'Aceito os' : 'Acepto los'}{' '}
            <a href="/terminos" className="text-primary underline">{isPT ? 'Termos e Condições' : 'Términos y Condiciones'}</a>
            {' '}{isPT ? 'e a' : 'y la'}{' '}
            <a href="/privacidad" className="text-primary underline">{isPT ? 'Política de Privacidade' : 'Política de Privacidad'}</a>
            {'.'}
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[#0F4C5C] font-semibold text-white text-[15px] disabled:opacity-50 uppercase tracking-wide"
        >
          {loading ? '...' : (isPT ? 'Criar conta' : 'Crear cuenta')}
        </button>

        <p className="text-center text-sm text-t3 lowercase pb-4">
          {isPT ? 'Já tem conta?' : '¿Ya tenés cuenta?'}{' '}
          <a href="/login" className="text-primary font-medium">{isPT ? 'Faça login' : 'Iniciá sesión'}</a>
        </p>
      </form>
    </div>
  );
}
