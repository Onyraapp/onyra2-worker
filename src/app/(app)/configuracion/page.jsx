// src/app/(app)/configuracion/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import {
  getConfiguracion, updateConfiguracion, signOut
} from '../../../lib/data';
import { MEDIOS_PAGO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, BtnPrimary, BtnDanger,
  Toast, useToast, Spinner, FieldLabel
} from '../../../components/ui';

export default function ConfiguracionPage() {
  const { usuario, recargar } = useAuth();
  const router = useRouter();
  const { toast, visible, show } = useToast();

  const [config,   setConfig]   = useState(null);
  const [retMap,   setRetMap]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!usuario) return;
    if (usuario.rol !== 'admin') { router.push('/dashboard'); return; }
    getConfiguracion(usuario.bar_id).then(c => {
      setConfig(c);
      const map = {};
      MEDIOS_PAGO.forEach(m => {
        map[m.key] = String(c[`retencion_${m.key}`] ?? m.defaultRet);
      });
      setRetMap(map);
    }).finally(() => setLoading(false));
  }, [usuario]);

  async function guardar() {
    setSaving(true);
    try {
      const updates = {};
      MEDIOS_PAGO.forEach(m => {
        updates[`retencion_${m.key}`] = parseFloat(retMap[m.key]) || 0;
      });
      await updateConfiguracion(usuario.bar_id, updates);
      show('✓ Configuración guardada');
    } catch {
      show('✗ Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  if (loading) return <Spinner />;

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {/* Bar info */}
      <Card>
        <CardHeader title="Tu bar" />
        <div className="p-4">
          <div className="text-lg font-black text-t1">{usuario?.bares?.nombre}</div>
          <div className="text-sm text-t3 mt-1">{usuario?.email}</div>
          <div className="text-xs text-t3 mt-0.5">Admin · {usuario?.nombre}</div>
        </div>
      </Card>

      {/* Retenciones */}
      <Card>
        <CardHeader title="Retenciones por medio de pago"
          subtitle="% que se descuenta del monto bruto" />
        <div className="p-4 flex flex-col gap-4">
          {MEDIOS_PAGO.map(m => (
            <div key={m.key} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
              <div className="flex-1">
                <div className="text-sm font-medium text-t1">{m.label}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={retMap[m.key] || ''}
                  onChange={e => setRetMap(r => ({ ...r, [m.key]: e.target.value }))}
                  min="0" max="100" step="0.1"
                  className="w-16 bg-offset border border-white/10 rounded-lg px-2 py-2 text-t1 text-sm
                    text-center focus:outline-none focus:border-primary/50 tabular-nums"
                />
                <span className="text-t3 text-sm">%</span>
              </div>
            </div>
          ))}
          <BtnPrimary label={saving ? 'Guardando...' : 'Guardar retenciones'} onClick={guardar} loading={saving} />
        </div>
      </Card>

      {/* Usuarios */}
      <Card>
        <CardHeader title="Usuarios" subtitle="Administrá los accesos a tu bar" />
        <div className="p-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-offset border border-white/10">
            <div>
              <div className="text-sm font-semibold text-t1">{usuario?.nombre}</div>
              <div className="text-xs text-t3">{usuario?.email} · Admin</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
              bg-primary/10 border border-primary/20 text-primary">Admin</span>
          </div>
          <p className="text-xs text-t3 mt-3 text-center">
            Para agregar cajeros, contactá soporte.
          </p>
        </div>
      </Card>

      {/* Cerrar sesión */}
      <BtnDanger label="Cerrar sesión" onClick={handleSignOut} />
    </Screen>
  );
}
