'use client';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const PLANES = [
  {
    key: 'pro',
    nombre: 'Troco Pro',
    precio: 'USD 6.99',
    desc: '1 local · 1 Admin + 3 Cajeros · Todas las funciones',
    stripe: 'https://buy.stripe.com/14A5kw2cM0F3fFt4Ifg7e00',
    mp: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=3067c71cd277415ba7a4fcc568b6fd79',
    pixCode: '00020126580014BR.GOV.BCB.PIX01365f6b583f-12a2-41fe-b7dd-dc66f7448cbf520400005303986540540.005802BR5913Gustavo Llusa6009SAO PAULO62140510a0w6UpTsAg63040044',
    pixLabel: 'R$ 40,00',
    destacado: true,
  },
  {
    key: 'multi',
    nombre: 'Troco Multilocal',
    precio: 'USD 14.99',
    desc: '5 locales · Admin central + 10 Cajeros',
    stripe: 'https://buy.stripe.com/bJebIU18I87v0Kz5Mjg7e01',
    mp: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=ceffd835393d4218af243f774da1399c',
    pixCode: '00020126580014BR.GOV.BCB.PIX01365f6b583f-12a2-41fe-b7dd-dc66f7448cbf520400005303986540586.005802BR5913Gustavo Llusa6009SAO PAULO621405102uEpyFJIdt6304AD6D',
    pixLabel: 'R$ 86,00',
    destacado: false,
  },
];

export default function PlanVencidoPage() {
  const { usuario } = useAuth();
  const [pixModal, setPixModal] = useState(null);
  const [copiado, setCopiado] = useState(false);

  function copiarPix(code) {
    navigator.clipboard.writeText(code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <img src="/logo.svg" alt="Troco" className="w-24 h-24" />
        <div>
          <div className="text-2xl font-bold text-t1 tracking-tight">Tu período de prueba terminó</div>
          <div className="text-sm text-t3 mt-2">Gracias por probar Troco. Para seguir usando la app elegí un plan.</div>
        </div>

        <div className="w-full flex flex-col gap-4">
          {PLANES.map(plan => (
            <div key={plan.key} className={`bg-surface rounded-2xl shadow-card p-5 text-left ${plan.destacado ? 'border-2 border-primary' : ''}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${plan.destacado ? 'text-primary' : 'text-t3'}`}>{plan.nombre}</div>
              <div className="text-2xl font-black text-t1 mb-1">{plan.precio} <span className="text-sm font-normal text-t3">/ mes</span></div>
              <div className="text-xs text-t3 mb-4">{plan.desc}</div>
              <div className="flex flex-col gap-2">
                <a href={plan.stripe} target="_blank"
                  className="w-full h-10 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2">
                  💳 Pagar con tarjeta
                </a>
                <a href={plan.mp} target="_blank"
                  className="w-full h-10 rounded-xl bg-[#009EE3] text-white font-semibold text-sm flex items-center justify-center gap-2">
                  💙 Mercado Pago
                </a>
                <button onClick={() => setPixModal(plan)}
                  className="w-full h-10 rounded-xl bg-[#32BCAD] text-white font-semibold text-sm flex items-center justify-center gap-2">
                  🟢 Pix · {plan.pixLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        <a href={"https://wa.me/55998202670?text=Hola%2C%20quiero%20contratar%20Troco%20para%20" + encodeURIComponent(usuario?.bares?.nombre || '')}
          target="_blank"
          className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] flex items-center justify-center shadow-sm">
          Contratar por WhatsApp
        </a>
        <div className="text-xs text-t3">También podés escribirnos a troco@gmail.com</div>
      </div>

      {pixModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl">
            <div className="text-center">
              <div className="text-3xl mb-2">🟢</div>
              <div className="text-lg font-bold text-t1">Pagar con Pix</div>
              <div className="text-sm text-t3 mt-1">{pixModal.nombre} · {pixModal.pixLabel}</div>
            </div>
            <div className="bg-offset rounded-xl p-3 text-xs text-t2 break-all font-mono">
              {pixModal.pixCode}
            </div>
            <button onClick={() => copiarPix(pixModal.pixCode)}
              className="w-full h-12 rounded-xl bg-[#32BCAD] text-white font-semibold text-[15px]">
              {copiado ? '✓ Copiado!' : 'Copiar código Pix'}
            </button>
            <button onClick={() => setPixModal(null)} className="w-full h-10 text-t3 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
