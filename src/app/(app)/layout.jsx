// src/app/(app)/layout.jsx
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { FullScreenSpinner } from '../../components/ui';

const NAV = [
  { href: '/dashboard', label: 'Hoy',     icon: '◫' },
  { href: '/cargar',    label: 'Cargar',   icon: '+' },
  { href: '/egresos',   label: 'Gastos',   icon: '−' },
  { href: '/resumen',   label: 'Resumen',  icon: '▤' },
  { href: '/mensual',   label: 'Mes',      icon: '∑' },
];

function AppShell({ children }) {
  const { usuario, cargando } = useAuth();
  const router    = useRouter();
  const pathname  = usePathname();

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login');
  }, [usuario, cargando]);

  if (cargando || !usuario) return <FullScreenSpinner />;

  const active = NAV.find(n => pathname.startsWith(n.href))?.href;

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-white/[0.08]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-green/15 border border-green/30
              flex items-center justify-center text-sm font-black text-greentext">⇡</div>
            <div>
              <div className="font-black text-t1 tracking-tight text-sm leading-tight">CajaBar</div>
              <div className="text-[10px] text-t3 leading-tight truncate max-w-[120px]">
                {usuario.bares?.nombre}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-t3">{usuario.nombre}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border
              ${usuario.rol === 'admin'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-amber/10 border-amber/20 text-ambertext'}`}>
              {usuario.rol}
            </span>
            {usuario.rol === 'admin' && (
              <Link href="/configuracion"
                className="w-7 h-7 rounded-lg bg-surface2 border border-white/10
                  flex items-center justify-center text-t3 text-sm">
                ⚙
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto
        bg-surface border-t border-white/[0.08] pb-safe flex">
        {NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
              ${active === n.href ? 'text-primary' : 'text-t3'}`}>
            <span className={`text-xl leading-none font-bold transition-transform
              ${active === n.href ? 'scale-110' : 'scale-100'}`}>{n.icon}</span>
            <span className="text-[11px] font-semibold tracking-wide">{n.label}</span>
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
