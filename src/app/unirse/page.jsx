'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getClient } from '../../lib/supabase';

function UnirseANegocioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo');

  const [bar, setBar] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarCodigo() {
      if (!codigo) { setError('Link inválido'); setVerificando(false); return; }
      const sb = getClient();
      const { data, error } = await sb
        .from('invitaciones')
        .select('*, bares(nombre)')
        .eq('codigo', codigo)
        .eq('usado', false)
        .gt('expires_at', new Date().toISOString())
        .single();
      if (error || !data) { setError('Este link no es válido o ya expiró'); setVerificando(false); return; }
      setBar(data.bares);
      setVerificando(false);
    }
    verificarCodigo();
  }, [codigo]);

  async function handleUnirse(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const sb = getClient();
      const { data: inv } = await sb
        .from('invitaciones')
        .select('*, bares(*)')
        .eq('codigo', codigo)
        .single();

      const { data: authData, error: authError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;

      const { error: userError } = await sb.from('usuarios').insert([{
        id: authData.user.id,
        bar_id: inv.bar_id,
        nombre: form.nombre,
        email: form.email,
        rol: 'cajero',
        estado: 'pendiente',
      }]);
      if (userError) throw userError;

      await sb.from('invitaciones').update({ usado: true }).eq('codigo', codigo);

      router.push('/espera');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (verificando) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-t3 text-sm">Verificando invitación...</p>
    </div>
  );

  if (error && !bar) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 gap-4">
      <p className="text-redtext text-sm text-center">{error}</p>
      <a href="/login" className="text-primary text-sm">Ir al inicio</a>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <img src="/logo.svg" alt="Troco" className="w-20 h-20 mb-3" />
        <span translate="no" className="font-neonize text-2xl text-t1 lowercase">troco</span>
        <span className="text-[11px] text-t3 mt-1 uppercase tracking-widest">unirte a un negocio</span>
      </div>

      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-card px-4 py-3 mb-4 text-center">
        <p className="text-[11px] text-t3 uppercase tracking-wide mb-1">Te unís a</p>
        <p className="text-t1 font-semibold text-lg">{bar?.nombre}</p>
      </div>

      <form onSubmit={handleUnirse} className="w-full max-w-sm flex flex-col gap-3">
        <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
          {[
            { key: 'nombre', label: 'Tu nombre', type: 'text', placeholder: 'Ej: Juan García' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
            { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' },
          ].map((f, i, arr) => (
            <div key={f.key} className={`px-4 py-3 ${i < arr.length - 1 ? 'border-b border-divider' : ''}`}>
              <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-1">{f.label}</div>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                required
                className="w-full bg-transparent text-t1 text-[15px] focus:outline-none placeholder:text-t4"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[#0F4C5C] font-semibold text-white text-[15px] disabled:opacity-50 uppercase tracking-wide"
        >
          {loading ? '...' : 'Unirme al negocio'}
        </button>
      </form>
    </div>
  );
}

export default function UnirseANegocio() {
  return (
    <Suspense fallback={null}>
      <UnirseANegocioContent />
    </Suspense>
  );
}
