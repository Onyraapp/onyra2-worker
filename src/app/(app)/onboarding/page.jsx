
// src/app/(app)/onboarding/page.jsx
'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { Screen, BtnPrimary } from '../../../components/ui';

const PASOS = [
  { icon: '🏪', titulo: 'Negocio creado', desc: 'Tu cuenta y negocio están listos.', done: true },
  { icon: '💳', titulo: 'Configurá retenciones', desc: 'Definí el % de cada medio de pago (tarjeta, QR, delivery).', done: false },
  { icon: '📲', titulo: 'Agregá WhatsApp', desc: 'Recibí el cierre diario directo en tu celular.', done: false },
  { icon: '✅', titulo: 'Listo para usar', desc: 'Empezá a registrar ventas con tu equipo.', done: false },
];

export default function OnboardingPage() {
  const { usuario } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center shadow-md mx-auto mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <div className="text-2xl font-bold text-t1 tracking-tight">¡Bienvenido a <span translate="no" className="font-neonize">Troco</span>!</div>
          <div className="text-sm text-t3 mt-1">Hola {usuario?.nombre}, tu negocio está listo.</div>
        </div>

        <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
          {PASOS.map((paso, i) => (
            <div key={i} className={`flex items-start gap-4 p-4 ${i < PASOS.length - 1 ? 'border-b border-divider' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                ${paso.done ? 'bg-greensoft' : 'bg-offset'}`}>
                {paso.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${paso.done ? 'text-greentext' : 'text-t1'}`}>
                  {paso.titulo}
                  {paso.done && <span className="ml-2 text-xs">✓</span>}
                </div>
                <div className="text-xs text-t3 mt-0.5">{paso.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <BtnPrimary label="Configurar ahora" onClick={() => router.push('/configuracion')} />
          <button onClick={() => router.push('/dashboard')}
            className="w-full h-11 rounded-xl text-t3 text-sm font-medium">
            Hacerlo después
          </button>
        </div>
      </div>
    </div>
  );
}
