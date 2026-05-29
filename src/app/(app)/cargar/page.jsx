// src/app/(app)/cargar/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import {
  getConfiguracion, calcularRetencion, getRetencionPct,
  abrirTurno, cerrarTurno, crearIngresosBulk, fmt, todayStr,
  getIngresosDia, getEgresosDia, calcularResumenDia, getTurnosCerradosHoy
} from '../../../lib/data';
import { getClient } from '../../../lib/supabase';
import { MEDIOS_PAGO, TURNOS } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  BtnPrimary, BtnSecondary, Toast, useToast, Spinner,
  FieldLabel, DivRow
} from '../../../components/ui';

const STORAGE_KEY = 'cajabar_lista_turno';

export default function CargarPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const { toast, visible, show } = useToast();

  const [config,      setConfig]      = useState(null);
  const [turno,       setTurno]       = useState(null);
  const [medio,       setMedio]       = useState('efectivo');
  const [monto,       setMonto]       = useState('');
  const [nota,        setNota]        = useState('');
  const [lista,       setLista]       = useState([]);
  const [cerrando,    setCerrando]    = useState(false);
  const [cerrandoDia, setCerrandoDia] = useState(false);
  const [anulando,    setAnulando]    = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  useEffect(() => {
    if (!usuario) return;
    getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLista(JSON.parse(saved));
    } catch {}
    getTurnosCerradosHoy(usuario.bar_id).then(cerrados => {
      if (cerrados.includes('1') && cerrados.includes('2')) setTurno('sin_turno');
      else if (cerrados.includes('1')) setTurno('2');
      else setTurno('1');
    }).catch(() => setTurno('1'));
  }, [usuario]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); } catch {}
  }, [lista]);

  const montoBruto = parseFloat(monto) || 0;
  const pct        = config ? getRetencionPct(config, medio) : 0;
  const preview    = montoBruto > 0 ? calcularRetencion(montoBruto, pct) : null;
  const activas    = lista.filter(i => !i.anulada);
  const anuladas   = lista.filter(i => i.anulada);
  const totalBruto     = activas.reduce((s, i) => s + i.monto_bruto, 0);
  const totalRetencion = activas.reduce((s, i) => s + i.retencion_monto, 0);
  const totalNeto      = activas.reduce((s, i) => s + i.monto_neto, 0);

  function agregarALista() {
    if (!montoBruto || montoBruto <= 0) return show('⚠ Ingresá un monto válido');
    const m    = MEDIOS_PAGO.find(mp => mp.key === medio);
    const calc = calcularRetencion(montoBruto, pct);
    setLista(l => [...l, { ...calc, medio_pago: medio, medio_label: m?.label, medio_color: m?.color, nota, anulada: false, _id: Date.now() }]);
    setMonto(''); setNota('');
  }

  function pedirAnulacion(item) { setAnulando(item); setMotivoAnulacion(''); }

  async function confirmarAnulacion() {
    if (!motivoAnulacion.trim()) return show('⚠ Ingresá un motivo');
    try {
      const sb = getClient();
      await sb.from('ingresos').insert([{
        bar_id: usuario.bar_id, turno_id: null, usuario_id: usuario.id,
        medio_pago: anulando.medio_pago, monto_bruto: anulando.monto_bruto,
        retencion_pct: anulando.retencion_pct, retencion_monto: anulando.retencion_monto,
        monto_neto: anulando.monto_neto, nota: anulando.nota || '',
        fecha: new Date().toISOString(), anulada: true, motivo_anulacion: motivoAnulacion,
      }]);
      setLista(l => l.map(i => i._id === anulando._id ? { ...i, anulada: true, motivo_anulacion: motivoAnulacion } : i));
      setAnulando(null);
      show('✓ Venta anulada y registrada');
    } catch { show('✗ Error al registrar anulación'); }
  }

  async function cerrarTurnoHandler() {
    if (activas.length === 0) return show('⚠ No hay ventas para cerrar');
    setCerrando(true);
    try {
      const t = await abrirTurno(usuario.bar_id, usuario.id, todayStr(), turno);
      const rows = activas.map(item => ({
        bar_id: usuario.bar_id, turno_id: t.id, usuario_id: usuario.id,
        medio_pago: item.medio_pago, monto_bruto: item.monto_bruto,
        retencion_pct: item.retencion_pct, retencion_monto: item.retencion_monto,
        monto_neto: item.monto_neto, nota: item.nota || '',
        fecha: new Date().toISOString(), anulada: false, motivo_anulacion: '',
      }));
      await crearIngresosBulk(rows);
      await cerrarTurno(t.id);
      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      if (turno === '1') setTurno('2');
      else if (turno === '2') setTurno('sin_turno');
      show(`✓ Turno cerrado · ${activas.length} ventas · ${fmt(totalBruto)} bruto`);
      setTimeout(() => router.push('/resumen'), 1500);
    } catch { show('✗ Error al cerrar turno'); }
    finally { setCerrando(false); }
  }

  async function cierreDiario() {
  setCerrandoDia(true);
  try {
    const [ing, egr, cfg] = await Promise.all([
      getIngresosDia(usuario.bar_id, todayStr()),
      getEgresosDia(usuario.bar_id, todayStr()),
      getConfiguracion(usuario.bar_id),
    ]);
    const res = calcularResumenDia(ing, egr);
    const fechaLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const pos = res.resultado >= 0;
    const msg = [
      `*CajaBar - Cierre del ${fechaLabel}*`, ``,
      `Ventas brutas:  ${fmt(res.totalBruto)}`,
      `Retenciones:    -${fmt(res.totalRetencion)}`,
      `Ventas netas:   ${fmt(res.totalNeto)}`,
      `Gastos:         -${fmt(res.totalEgresos)}`, ``,
      `Resultado: *${res.resultado >= 0 ? '' : '-'}${fmt(Math.abs(res.resultado))}*`, ``,
      `_${ing.filter(i => !i.anulada).length} ventas - ${ing.filter(i => i.anulada).length} anulaciones_`,
    ].join('\n');
    const numero = cfg?.whatsapp_numero?.trim();
    const url = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  } catch { show('Error al generar el cierre'); }
  finally { setCerrandoDia(false); }
}

  if (!config || turno === null) return <Spinner />;

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {anulando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-8 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-5 flex flex-col gap-4 shadow-xl">
            <div>
              <div className="text-base font-bold text-t1">Anular venta</div>
              <div className="text-sm text-t3 mt-1">{anulando.medio_label} · {fmt(anulando.monto_bruto)}</div>
            </div>
            <div>
              <FieldLabel>Motivo de anulación</FieldLabel>
              <textarea value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)}
                placeholder="Ej: error de carga, cliente canceló..." rows={3}
                className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-red/40 placeholder:text-t4 transition resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAnulando(null)} className="flex-1 h-11 rounded-xl bg-offset text-t2 text-sm font-medium">Cancelar</button>
              <button onClick={confirmarAnulacion} className="flex-1 h-11 rounded-xl bg-redsoft border border-red/20 text-redtext text-sm font-semibold">Confirmar anulación</button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Turno</FieldLabel>
            <button onClick={cierreDiario} disabled={cerrandoDia}
              className="px-3 py-1.5 rounded-xl bg-green text-white text-xs font-semibold shadow-sm disabled:opacity-40">
              {cerrandoDia ? '...' : '📲 Cierre diario'}
            </button>
          </div>
          <ChipGroup options={TURNOS.map(t => ({ value: t.key, label: `${t.icon} ${t.label}` }))} value={turno} onChange={setTurno} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Nueva venta" subtitle="Se agrega a la lista del turno" />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>Medio de pago</FieldLabel>
            <ChipGroup options={MEDIOS_PAGO.map(m => ({ value: m.key, label: m.label, color: m.color }))} value={medio} onChange={setMedio} />
          </div>
          <div>
            <FieldLabel>Monto bruto</FieldLabel>
            <MontoInput value={monto} onChange={setMonto} color={medio ? MEDIOS_PAGO.find(m => m.key === medio)?.color : null} />
          </div>
          {preview && (
            <div className="bg-offset rounded-xl border border-divider p-3">
              <DivRow label="Monto bruto" value={fmt(preview.monto_bruto)} />
              {preview.retencion_pct > 0 && <DivRow label={`Retención (${preview.retencion_pct}%)`} value={`−${fmt(preview.retencion_monto)}`} valueClass="text-redtext" />}
              <DivRow label="Monto neto" value={fmt(preview.monto_neto)} valueClass="text-greentext" bold />
            </div>
          )}
          <div>
            <FieldLabel>Nota (opcional)</FieldLabel>
            <input value={nota} onChange={e => setNota(e.target.value)} placeholder="Mesa 5, delivery, etc..."
              className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4" />
          </div>
          <button onClick={agregarALista} className="w-full h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm active:scale-[0.98] transition-all">
            + Agregar a lista
          </button>
        </div>
      </Card>

      {activas.length > 0 && (
        <Card>
          <CardHeader title={`Lista · ${activas.length} ventas`} subtitle={`${fmt(totalBruto)} bruto`} />
          <div className="p-4 flex flex-col gap-2">
            {activas.map(item => (
              <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl bg-offset border border-divider">
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: item.medio_color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-t1">{item.medio_label}</div>
                  {item.nota && <div className="text-xs text-t3 truncate">{item.nota}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums text-t1">{fmt(item.monto_bruto)}</div>
                  {item.retencion_monto > 0 && <div className="text-xs text-redtext tabular-nums">−{fmt(item.retencion_monto)}</div>}
                </div>
                <button onClick={() => pedirAnulacion(item)} className="w-8 h-8 rounded-lg bg-redsoft flex items-center justify-center text-redtext text-sm flex-shrink-0">✕</button>
              </div>
            ))}
            <div className="mt-1 bg-offset rounded-xl border border-divider p-3">
              <DivRow label="Total bruto"       value={fmt(totalBruto)} />
              <DivRow label="Total retenciones" value={`−${fmt(totalRetencion)}`} valueClass="text-redtext" />
              <DivRow label="Total neto"        value={fmt(totalNeto)} valueClass="text-greentext" bold />
            </div>
            <BtnPrimary label={cerrando ? 'Cerrando...' : `✓ Cerrar turno · ${activas.length} ventas`} onClick={cerrarTurnoHandler} loading={cerrando} className="mt-1" />
            <BtnSecondary label="Limpiar todo" onClick={() => { setLista([]); localStorage.removeItem(STORAGE_KEY); }} />
          </div>
        </Card>
      )}

      {anuladas.length > 0 && (
        <Card>
          <CardHeader title={`Anuladas · ${anuladas.length}`} />
          <div className="p-4 flex flex-col gap-2">
            {anuladas.map(item => (
              <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl bg-redsoft/50 border border-red/10 opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-t2 line-through">{item.medio_label} · {fmt(item.monto_bruto)}</div>
                  <div className="text-xs text-redtext mt-0.5">{item.motivo_anulacion}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {lista.length === 0 && (
        <div className="text-center py-8 text-t3 text-sm">
          Agregá ventas a la lista y cerrá el turno al terminar.
        </div>
      )}
    </Screen>
  );
}
