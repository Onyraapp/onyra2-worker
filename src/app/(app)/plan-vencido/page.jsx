'use client';
import { useAuth } from '../../../hooks/useAuth';

export default function PlanVencidoPage() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <img src="/logo.svg" alt="Troco" className="w-30 h-30" />
        <div>
          <div className="text-2xl font-bold text-t1 tracking-tight">Tu período de prueba terminó</div>
          <div className="text-sm text-t3 mt-2">Gracias por probar Troco. Para seguir usando la app elegí un plan.</div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <a href="https://buy.stripe.com/price_1TcnEM2fy49WJZAKPtrHvsxF" target="_blank" className="bg-surface rounded-2xl shadow-card p-5 border-2 border-primary text-left block">
            <div className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">Troco Pro</div>
            <div className="text-2xl font-black text-t1 mb-1">USD 6.99 <span className="text-sm font-normal text-t3">/ mes</span></div>
            <div className="text-xs text-t3">1 local · 1 Admin + 3 Cajeros · Todas las funciones</div>
          </a>
          <a href="https://buy.stripe.com/price_1TcnFY2fy49WJZAKZyoSmm4S" target="_blank" className="bg-surface rounded-2xl shadow-card p-5 text-left block">
            <div className="text-[11px] font-semibold text-t3 uppercase tracking-wide mb-1">Troco Multilocal</div>
            <div className="text-2xl font-black text-t1 mb-1">USD 14.99 <span className="text-sm font-normal text-t3">/ mes</span></div>
            <div className="text-xs text-t3">5 locales · Admin central + 10 Cajeros</div>
          </a>
        </div>
        <a href={"https://wa.me/55998202670?text=Hola%2C%20quiero%20contratar%20Troco%20para%20" + encodeURIComponent(usuario?.bares?.nombre || '')} target="_blank" className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] flex items-center justify-center shadow-sm">
          Contratar por WhatsApp
        </a>
        <div className="text-xs text-t3">También podés escribirnos a troco@gmail.com</div>
      </div>
    </div>
  );
}
