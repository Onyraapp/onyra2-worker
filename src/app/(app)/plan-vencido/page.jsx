// src/app/(app)/plan-vencido/page.jsx
'use client';
import { useAuth } from '../../../hooks/useAuth';

export default function PlanVencidoPage() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <img src="/logo.svg" alt="Troco" className="w-16 h-16" />
        <div>
          <div className="text-2xl font-bold text-t1 tracking-tight">Tu período de prueba terminó</div>
          <div className="text-sm text-t3 mt-2">
            Gracias por probar Troco. Para seguir usando la app elegí un plan.
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <a href="https://buy.stripe.com/price_1TcnEM2fy49WJZAKPtrHvsxF"
            target="_blank"
            className="bg-surface rounded-2xl shadow-card p-5 border-2 border-primary text-left block">
            <div className="text-[1
