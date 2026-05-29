// src/app/(app)/configuracion/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { getConfiguracion, updateConfiguracion, getCajeros, registrarCajero, updateBar, signOut } from '../../../lib/data';
import { MEDIOS_PAGO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, BtnPrimary, BtnDanger,
  Toast, useToast, Spinner, FieldLabel, Input
} from '../../../components/ui';

export default function ConfiguracionPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const { toast, visible, show } = useToast();

  const [config,   setConfig]   = useState(null);
  const [retMap,   setRetMap]   = useState({});
  const [cajeros,  setCajeros]  = useState([]);
  const [nombreBar, setNombreBar] = useState('');
  const [waNumero, setWaNumero] = useState('');
  const [waCierreTurno,  setWaCierreTurno]  = useState(false);
  const [waAlertaGasto,  setWaAlertaGasto]  = useState(false);
  const [waAlertaMonto,  setWaAlertaMonto]  = useState('10000');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [savingWa, setSavingWa] = useState(false);
  const [savingBar, setSavingBar] = useState(false);

  const [showFormCajero, setShowFormCajero] = useState(false);
  const [cajNombre,   setCajNombre]   = useState('');
  const [cajEmail,    setCajEmail]    = useState('');
  const [cajPassword, setCajPassword] = useState('');
  const [savingCaj,   setSavingCaj]   = useState(false);

  useEffect(() => {
    if (!usuario) return;
    if (usuario.rol !== 'admin') { router.push('/dashboard'); return; }
    Promise.all([
      getConfiguracion(usuario.bar_id),
      getCajeros(usuario.bar_id),
    ]).then(([c, cajs]) => {
      setConfig(c);
      const map = {};
      MEDIOS_PAGO.forEach(m => { map[m.key] = String(c[`retencion_${m.key}`] ?? 0); });
      setRetMap(map);
      setWaNumero(c.whatsapp_numero || '');
      setWaCierreTurno(c.wa_cierre_turno || false);
      setWaAlertaGasto(c.wa_alerta_gasto || false);
      setWaAlertaMonto(String(c.wa_alerta_gasto_monto || 10000));
      setCajeros(cajs);
      setNombreBar(usuario.bares?.nombre || '');
    }).finally(() => setLoading(false));
  }, [usuario]);

  async function guardarNombreBar() {
    setSavingBar(true);
    try {
      await updateBar(usuario.bar_id, { nombre: nombreBar });
      show('✓ Nombre actualizado');
    } catch { show('✗ Error al guardar'); }
    finally { setSavingBar(false); }
  }

  async function guardar() {
    setSaving(true);
    try {
      const updates = {};
      MEDIOS_PAGO.forEach(m => { updates[`retencion_${m.key}`] = parseFloat(retMap[m.key]) || 0; });
      await updateConfiguracion(usuario.bar_id, updates);
      show('✓ Retenciones guardadas');
    } catch { show('✗ Error al guardar'); }
    finally { setSaving(false); }
  }

  async function guardarWa() {
    setSavingWa(true);
    try {
      await updateConfiguracion(usuario.bar_id, {
        whatsapp_numero:       waNumero,
        wa_cierre_turno:       waCierreTurno,
        wa_alerta_gasto:       waAlertaGasto,
        wa_alerta_gasto_monto: parseFloat(waAlertaMonto) || 10000,
      });
      show('✓ Configuración guardada');
    } catch { show('✗ Error al guardar'); }
    finally { setSavingWa(false); }
  }

  async function agregarCajero() {
    if (!cajNombre || !cajEmail || !cajPassword) return show('⚠ Completá todos los campos');
    if (cajPassword.length < 6) return show('⚠ La contraseña debe tener al menos 6 caracteres');
    setSavingCaj(true);
    try {
      await registrarCajero({ barId: usuario.bar_id, nombre: cajNombre, email: cajEmail, password: cajPassword });
      const cajs = await getCajeros(usuario.bar_id);
      setCajeros(cajs);
      setCajNombre(''); setCajEmail(''); setCajPassword('');
      setShowFormCajero(false);
      show('✓ Cajero agregado');
    } catch (e) {
      show(e.message?.includes('already') ? '✗ Ese email ya existe' : '✗ Error al crear cajero');
    } finally { setSavingCaj(false); }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  function Toggle({ label, sublabel, value, onChange }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-divider last:border-0">
        <div>
          <div className="text-sm font-medium text-t1">{label}</div>
          {sublabel && <div className="text-xs text-t3 mt-0.5">{sublabel}</div>}
        </div>
        <button onClick={() => onChange(!value)}
          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-primary' : 'bg-t4'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      <Card>
        <CardHeader title="Tu negocio" />
        <div className="p-4 flex flex-col gap-3">
          <div className="text-xs text-t3">{usuario?.email} · Admin · {usuario?.nombre}</div>
          <div>
            <FieldLabel>Nombre del negocio</FieldLabel>
            <input value={nombreBar} onChange={e => setNombreBar(e.target.value)}
              placeholder="Ej: Bar El Gaucho"
              className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4" />
          </div>
          <BtnPrimary label={savingBar ? 'Guardando...' : 'Guardar nombre'} onClick={guardarNombreBar} loading={savingBar} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Retenciones por medio de pago" subtitle="% que se descuenta del monto bruto" />
        <div className="p-4 flex flex-col gap-4">
          {MEDIOS_PAGO.map(m => (
            <div key={m.key} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
              <div className="flex-1">
                <div className="text-sm font-medium text-t1">{m.label}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <input type="number" value={retMap[m.key] || ''} onChange={e => setRetMap(r => ({ ...r, [m.key]: e.target.value }))}
                  min="0" max="100" step="0.1"
                  className="w-16 bg-offset border border-divider rounded-lg px-2 py-2 text-t1 text-sm text-center focus:outline-none tabular-nums" />
                <span className="text-t3 text-sm">%</span>
              </div>
            </div>
          ))}
          <BtnPrimary label={saving ? 'Guardando...' : 'Guardar retenciones'} onClick={guardar} loading={saving} />
        </div>
      </Card>

      <Card>
        <CardHeader title="WhatsApp" subtitle="Notificaciones y número de destino" />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>Número de WhatsApp</FieldLabel>
            <input value={waNumero} onChange={e => setWaNumero(e.target.value)}
              placeholder="Ej: 5491123456789"
              className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4" />
            <div className="text-xs text-t3 mt-1">Código de país sin + (ej: 549 para Argentina)</div>
          </div>
          <div className="bg-offset rounded-xl px-4">
            <Toggle label="Notificar al cerrar turno" sublabel="Manda el resumen del turno por WhatsApp" value={waCierreTurno} onChange={setWaCierreTurno} />
            <Toggle label="Alerta de gasto grande" sublabel="Avisa cuando un gasto supera el monto mínimo" value={waAlertaGasto} onChange={setWaAlertaGasto} />
            {waAlertaGasto && (
              <div className="py-3 border-b border-divider">
                <FieldLabel>Monto mínimo para alerta</FieldLabel>
                <div className="flex items-center gap-2">
                  <span className="text-t3">$</span>
                  <input type="number" value={waAlertaMonto} onChange={e => setWaAlertaMonto(e.target.value)}
                    className="flex-1 bg-surface rounded-xl px-4 py-2.5 text-t1 text-sm border border-divider focus:outline-none tabular-nums" />
                </div>
              </div>
            )}
          </div>
          <BtnPrimary label={savingWa ? 'Guardando...' : 'Guardar configuración'} onClick={guardarWa} loading={savingWa} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Equipo" subtitle={`${cajeros.length} usuarios`}
          right={
            <button onClick={() => setShowFormCajero(!showFormCajero)}
              className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
              + Cajero
            </button>
          }
        />
        <div className="p-4 flex flex-col gap-2">
          {showFormCajero && (
            <div className="bg-offset rounded-xl p-4 flex flex-col gap-3 mb-2">
              <div className="text-sm font-semibold text-t1">Nuevo cajero</div>
              <Input value={cajNombre} onChange={setCajNombre} placeholder="Nombre" />
              <Input value={cajEmail} onChange={setCajEmail} placeholder="Email" type="email" />
              <Input value={cajPassword} onChange={setCajPassword} placeholder="Contraseña (mín. 6 caracteres)" type="password" />
              <div className="flex gap-2">
                <button onClick={() => setShowFormCajero(false)} className="flex-1 h-10 rounded-xl bg-surface border border-divider text-t2 text-sm">Cancelar</button>
                <button onClick={agregarCajero} disabled={savingCaj}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40">
                  {savingCaj ? '...' : 'Agregar'}
                </button>
              </div>
            </div>
          )}
          {cajeros.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-offset border border-divider">
              <div>
                <div className="text-sm font-semibold text-t1">{c.nombre}</div>
                <div className="text-xs text-t3">{c.email}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold
                ${c.rol === 'admin' ? 'bg-primary/10 text-primary' : 'bg-ambersoft text-ambertext'}`}>
                {c.rol === 'admin' ? 'Admin' : 'Cajero'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <BtnDanger label="Cerrar sesión" onClick={handleSignOut} />
    </Screen>
  );
}
