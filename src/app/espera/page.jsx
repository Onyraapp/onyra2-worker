'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUsuarioActual } from '../../lib/data';

export default function EsperaPage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar cada 30 segundos si fue aprobado
    async function check() {
      const usuario = await getUsuarioActual();
      if (!usuario) { router.push('/login'); return; }
      if (usuario.estado === 'activo') { router.push('/'); }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-14 h-14 rounded-[18px] bg-[#0F4C5C] flex items-center justify-center">
        <svg width="32" height="32" viewBox="220 70 240 240" xmlns="http://www.w3.org/2000/svg">
          <rect x="190" y="40" width="300" height="300" rx="66" fill="#0F4C5C"/>
          <rect x="225" y="110" width="230" height="15" rx="7" fill="#FFFFFF"/>
          <rect x="238" y="148" width="175" height="15" rx="7" fill="#7FFFD4"/>
          <rect x="231" y="186" width="205" height="15" rx="7" fill="#FFFFFF"/>
          <rect x="225" y="224" width="230" height="15" rx="7" fill="#7FFFD4"/>
          <rect x="248" y="258" width="145" height="12" rx="6" fill="#FFFFFF" opacity="0.35"/>
        </svg>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-t1 mb-2">Solicitud enviada</h1>
        <p className="text-sm text-t3 leading-relaxed">
          Tu solicitud fue enviada al administrador del negocio.<br/>
          Te avisaremos cuando seas aprobado.
        </p>
      </div>

      <div className="w-8 h-8 border-2 border-[#0F4C5C] border-t-transparent rounded-full animate-spin" />

      <p className="text-xs text-t4">Verificando automáticamente...</p>
    </div>
  );
}
