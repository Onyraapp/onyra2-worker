// src/app/(app)/cargar/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getConfiguracion, calcularRetencion, getRetencionPct,
  abrirTurno, cerrarTurno, crearIngresosBulk, fmt, todayStr
} from '../../../lib/data';
import { MEDIOS_PAGO, TURNOS } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  BtnPrimary, BtnSecondary, Toast, useToast, Spinner,
  FieldLabel, DivRow, ResultadoCard
} from '../../../components/ui';

export default function CargarPage() {
  const { usuario } = useAuth();
  const { toast, visible, show } = useToast();

  const [config,  setConfig]  = useState(null);
  const [turno,   setTurno]   = useState('1');
  const [medio,   setMedio]   = useState('efectivo');
  const [monto,   setMonto]   = useState('');
  const [nota,    setNota]    = useState('');
  const [lista,   setLista]   = useState([]); // acumulado del turno
  const [cerrando,setCerrando]= useState(false);
  const [turnoObj,setTurnoObj]= useState(null); // turno abierto en DB

  useEffect(() => {
    if (usuario) getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});
  }, [usuario]);

  // Preview de retención para el monto actual
  const montoBruto = parseFloat(monto) || 0;
  const pct        = config ? getRetencionPct(config, medio) : 0;
  const preview    = montoBruto > 0 ? calcularRetencion(montoBruto, pct) : null;

  // Totales de la lista
  const totalBruto     = lista.reduce((s, i) => s + i.monto_bruto, 0);
  const totalRetencion = lista.reduce((s, i) => s + i.retencion_monto, 0);
  const totalNeto      = lista.reduce((s, i) => s + i.monto_neto, 0);

  function agregarALista() {
    if (!montoBruto || montoBruto <= 0) return show('⚠ Ingresá un monto válido');
    const m = MEDIOS_PAGO.find(mp => mp.key === medio);
    const calc = calcularRetencion(montoBruto, pct);
    setLista(l => [...l, {
      ...calc,
      medio_pago: medio,
      medio_label: m?.label,
      medio_color: m?.color,
      nota,
      _id: Date.now(),
    }]);
    setMonto(''); setNota('');
  }

  function quitarDeLista(id) {
    setLista(l => l.filter(i => i._id !== id));
  }

  async function cerrarTurnoHandler() {
    if (lista.length === 0) return show('⚠ Agregá al menos una venta');
    setCerrando(true);
    try {
      // Abrir o reusar turno
      let t = turnoObj;
      if (!t) {
        t = await abrirTurno(usuario.bar_id, usuario.id, todayStr(), turno);
        setTurnoObj(t);
      }

      // Guardar todos los ingresos
      const rows = lista.map(item => ({
        bar_id:          usuario.bar_id,
        turno_id:        t.id,
        usuario_id:      usuario.id,
        medio_pago:      item.medio_pago,
        monto_bruto:     item.monto_bruto,
        retencion_pct:   item.retencion_pct,
        retencion_monto: item.retencion_monto,
        monto_neto:      item.monto_neto,
        nota:            item.nota || '',
        fecha:           new Date().toISOString(),
      }));
      await crearIngresosBulk(rows);

      // Cerrar turno
      await cerrarTurno(t.id);

      show(`✓ Turno cerrado · ${lista.length} ventas · ${fmt(totalNeto)} neto`);
      setLista([]); setTurnoObj(null);
    } catch (e) {
      show('✗ Error al cerrar turno. Intentá de nuevo.');
    } finally {
      setCerrando(false);
    }
  }

  if (!config) return <Spinner />;

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {/* Turno selector */}
      <Card>
        <div className="p-4">
          <FieldLabel>Turno</FieldLabel>
          <ChipGroup
            options={TURNOS.map(t => ({ value: t.key, label: `${t.icon} ${t.label}` }))}
            value={turno}
            onChange={setTurno}
          />
        </div>
      </Card>

      {/* Formulario de carga */}
      <Card>
        <CardHeader title="Nueva venta" subtitle="Se agrega a la lista del turno" />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>Medio de pago</FieldLabel>
            <ChipGroup
              options={MEDIOS_PAGO.map(m => ({ value: m.key, label: m.label, color: m.color }))}
              value={medio}
              onChange={setMedio}
            />
          </div>

          <div>
            <FieldLabel>Monto bruto</FieldLabel>
            <MontoInput value={monto} onChange={setMonto}
              color={medio ? MEDIOS_PAGO.find(m=>m.key===medio)?.color : null} />
          </div>

          {/* Preview retención */}
          {preview && (
            <div className="bg-offset rounded-xl border border-white/10 p-3 flex flex-col gap-2">
              <DivRow label="Monto bruto"   value={fmt(preview.monto_bruto)} />
              {preview.retencion_pct > 0 && (
                <DivRow label={`Retención (${preview.retencion_pct}%)`}
                  value={`−${fmt(preview.retencion_monto)}`} valueClass="text-redtext" />
              )}
              <DivRow label="Monto neto" value={fmt(preview.monto_neto)}
                valueClass="text-greentext" bold />
            </div>
          )}

          <div>
            <FieldLabel>Nota (opcional)</FieldLabel>
            <input
              value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Mesa 5, delivery, etc..."
              className="w-full bg-offset border border-white/10 rounded-xl px-3 py-3 text-t1 text-sm
                focus:outline-none focus:border-primary/50 placeholder:text-t3"
            />
          </div>

          <button onClick={agregarALista}
            className="w-full h-11 rounded-xl bg-primary/15 border border-primary/30
              text-primary font-bold text-sm active:scale-[0.98] transition-transform">
            + Agregar a lista
          </button>
        </div>
      </Card>

      {/* Lista acumulada */}
      {lista.length > 0 && (
        <Card>
          <CardHeader title={`Lista del turno · ${lista.length} ventas`}
            subtitle={`${fmt(totalBruto)} bruto · ${fmt(totalNeto)} neto`} />
          <div className="p-4 flex flex-col gap-2">
            {lista.map(item => (
              <div key={item._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.medio_color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-t1">{item.medio_label}</div>
                  {item.nota && <div className="text-xs text-t3 truncate">{item.nota}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums text-greentext">{fmt(item.monto_neto)}</div>
                  {item.retencion_monto > 0 && (
                    <div className="text-xs text-redtext tabular-nums">−{fmt(item.retencion_monto)}</div>
                  )}
                </div>
                <button onClick={() => quitarDeLista(item._id)}
                  className="text-t3 hover:text-redtext text-lg w-6 flex-shrink-0">×</button>
              </div>
            ))}

            {/* Totales */}
            <div className="mt-2 bg-offset rounded-xl border border-white/10 p-3 flex flex-col gap-1.5">
              <DivRow label="Total bruto"      value={fmt(totalBruto)} />
              <DivRow label="Total retenciones" value={`−${fmt(totalRetencion)}`} valueClass="text-redtext" />
              <DivRow label="Total neto"        value={fmt(totalNeto)} valueClass="text-greentext" bold />
            </div>

            <BtnPrimary
              label={cerrando ? 'Cerrando turno...' : `✓ Cerrar turno · ${lista.length} ventas`}
              onClick={cerrarTurnoHandler}
              loading={cerrando}
              className="mt-2"
            />
            <BtnSecondary label="Limpiar lista" onClick={() => setLista([])} />
          </div>
        </Card>
      )}

      {lista.length === 0 && (
        <div className="text-center py-8 text-t3 text-sm">
          Agregá ventas a la lista y al terminar el turno cerralo de una vez.
        </div>
      )}
    </Screen>
  );
}
