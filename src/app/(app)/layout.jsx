// src/app/(app)/layout.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { FullScreenSpinner } from '../../components/ui';
import { getClient } from '../../lib/supabase';

const NAV = [
  { href: '/dashboard',    label: 'Hoy',     icon: '◫' },
  { href: '/cargar',       label: 'Cargar',   icon: '+' },
  { href: '/egresos',      label: 'Gastos',   icon: '−' },
  { href: '/resumen',      label: 'Resumen',  icon: '▤' },
  { href: '/vencimientos', label: 'Expira',   icon: '⏰' },
];

function AppShell({ children }) {
  const { usuario, cargando } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [alertasVenc, setAlertasVenc] = useState([]);
  const [modalAlerta, setModalAlerta] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login');
  }, [usuario, cargando]);

  useEffect(() => {
    if (!usuario) return;
    async function checkVencimientos() {
      const sb = getClient();
      const hoy = new Date().toISOString().slice(0, 10);
      const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const { data } = await sb
        .from('vencimientos')
        .select('*')
        .eq('bar_id', usuario.bar_id)
        .in('fecha', [hoy, manana]);
      if (data && data.length > 0) {
        setAlertasVenc(data);
        setModalAlerta(true);
      }
    }
    checkVencimientos();
  }, [usuario]);

  if (cargando || !usuario) return <FullScreenSpinner />;

  const ahora = new Date();
  const trialHasta = usuario.bares?.trial_hasta ? new Date(usuario.bares.trial_hasta) : null;
  const planVencido = !usuario.bares?.plan_activo || (usuario.bares?.plan === 'trial' && trialHasta && ahora > trialHasta);

  if (planVencido && pathname !== '/plan-vencido') {
    router.push('/plan-vencido');
    return <FullScreenSpinner />;
  }

  const active = NAV.find(n => pathname.startsWith(n.href))?.href;

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto overflow-x-hidden">

      {/* Alerta vencimientos */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl">
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-lg font-bold text-t1">Vencimientos próximos</div>
            </div>
            <div className="flex flex-col gap-2">
              {alertasVenc.map(v => {
                const hoy = new Date().toISOString().slice(0, 10);
                const esHoy = v.fecha === hoy;
                return (
                  <div key={v.id} className="bg-offset rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold text-t1">{v.detalle}</div>
                      <div className={`text-xs font-bold ${esHoy ? 'text-red-500' : 'text-amber-500'}`}>
                        {esHoy ? '⚠ Hoy' : '⚠ Mañana'}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-t1">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v.importe)}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setModalAlerta(false)}
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px]">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-white/[0.08]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green/15 border border-green/30 flex items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="Troco" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="font-neonize text-t1 tracking-tight text-sm leading-none mt-3" translate="no">Troco</div>
              <div className="text-[10px] text-t3 leading-none truncate max-w-[120px] mt-2">
                {usuario.bares?.nombre}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border
              ${usuario.rol === 'admin'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-amber/10 border-amber/20 text-ambertext'}`}>
              {usuario.rol}
            </span>
            {usuario.bares?.plan === 'trial' && (() => {
              const dias = Math.ceil((new Date(usuario.bares.trial_hasta) - new Date()) / (1000 * 60 * 60 * 24));
              if (dias <= 0) return <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-redsoft text-redtext">Vencido</span>;
              if (dias <= 7) return <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-ambersoft text-ambertext">{dias}d trial</span>;
              return <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-offset text-t3">{dias}d trial</span>;
            })()}
            {usuario.rol === 'admin' && (
              <Link href="/configuracion"
                className="w-7 h-7 rounded-lg bg-surface2 border border-white/10 flex items-center justify-center text-t3 text-sm">
                ⚙
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto
        bg-surface border-t border-white/[0.08] pb-safe flex items-center justify-around px-4 py-3">
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className="flex flex-col items-center gap-1.5">
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all
              ${active === n.href ? 'bg-[#CBD5E1] shadow-md scale-105' : 'bg-[#0F4C5C]'}`}>
              <span className="text-white text-xl leading-none font-bold">{n.icon}</span>
            </div>
            <span className={`text-[10px] font-semibold tracking-wide
              ${active === n.href ? 'text-primary' : 'text-t3'}`}>
              {n.label}
            </span>
          </Link>
        ))}
      </nav>

    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
