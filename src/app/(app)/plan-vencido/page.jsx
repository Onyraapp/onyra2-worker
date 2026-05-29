// src/app/(app)/plan-vencido/page.jsx
'use client';
import { useAuth } from '../../../hooks/useAuth';

export default function PlanVencidoPage() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center shadow-md">
          <span className="text-white text-2xl font-bold">C</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-t1 tracking-tight">Tu período de prueba terminó</div>
          <div className="text-sm text-t3 mt-2">
            Gracias por probar CajaSmart. Para seguir usando la app elegí un plan.
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="bg-surface rounded-2xl shadow-card p-5 border-2 border-primary">
            <div className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">Básico</div>
            <div className="text-2xl font-black text-t1 mb-1">$X <span className="text-sm font-normal text-t3">/ mes</span></div>
            <div className="text-xs text-t3">1 local · 1 Admin + 3 Cajeros · Todas las funciones</div>
          </div>
          <div className="bg-surface rounded-2xl shadow-card p-5">
            <div className="text-[11px] font-semibold text-t3 uppercase tracking-wide mb-1">Multi</div>
            <div className="text-2xl font-black text-t1 mb-1">$X <span className="text-sm font-normal text-t3">/ mes</span></div>
            <div className="text-xs text-t3">5 locales · Admin central + 10 Cajeros</div>
          </div>
        </div>

        <a href={`https://wa.me/549TUNUMERO?text=Hola%2C%20quiero%20contratar%20CajaSmart%20para%20${encodeURIComponent(usuario?.bares?.nombre || '')}`}
          target="_blank"
          className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] flex items-center justify-center shadow-sm">
          Contratar por WhatsApp
        </a>
        <div className="text-xs text-t3">También podés escribirnos a cajasmart@email.com</div>
      </div>
    </div>
  );
}
