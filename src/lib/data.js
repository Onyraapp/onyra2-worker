// src/app/(app)/cargar/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getConfiguracion, calcularRetencion, getRetencionPct,
  abrirTurno, cerrarTurno, crearIngresosBulk, crearIngreso, fmt, todayStr
} from '../../../lib/data';
import { getClient } from './supabase';
import { MEDIOS_PAGO, TURNOS } from './constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  BtnPrimary, BtnSecondary, Toast, useToast, Spinner,
  FieldLabel, DivRow
} from '../../../components/ui';

const STORAGE_KEY = 'cajabar_lista_turno';

export default function CargarPage() {
  const { usuario } = useAuth();
  const { toast, visible, show } = useToast();

  const [config,   setConfig]   = useState(null);
  const [turno,    setTurno]    = useState('1');
  const [medio,    setMedio]    = useState('efectivo');
  const [monto,    setMonto]    = useState('');
  const [nota,     setNota]     = useState('');
  const [lista,    setLista]    = useState([]);
  const [cerrando, setCerrando] = useState(false);

  // Modal de anulación
  const [anulando,      setAnulando]      = useState(null); // item a anular
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  useEffect(() => {
    if (usuario) {
      getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});
      // Restaurar lista guardada
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setLista(JSON.parse(saved));
      } catch {}
    }
  }, [usuario]);

  // Guardar lista en localStorage cuando cambia
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); } catch {}
  }, [lista]);

  const montoBruto = parseFloat(monto) || 0;
  const pct        = config ? getRetencionPct(config, medio) : 0;
  const preview    = montoBruto > 0 ? calcularRetencion(montoBruto, pct) : null;

  const totalBruto     = lista.filter(i => !i.anulada).reduce((s, i) => s + i.monto_bruto, 0);
  const totalRetencion = lista.filter(i => !i.anulada).reduce((s, i) => s + i.retencion_monto, 0);
  const totalNeto      = lista.filter(i => !i.anulada).reduce((s, i) => s + i.monto_neto, 0);
  const anuladas       = lista.filter(i => i.anulada);
  const activas        = lista.filter(i => !i.anulada);

  function agregarALista() {
    if (!montoBruto || montoBruto <= 0) return show('⚠ Ingresá un monto válido');
    const m    = MEDIOS_PAGO.find(mp => mp.key === medio);
    const calc = calcularRetencion(montoBruto, pct);
    const item = {
      ...calc,
      medio_pago:  medio,
      medio_label: m?.label,
      medio_color: m?.color,
      nota,
      anulada:     false,
      _id:         Date.now(),
    };
    setLista(l => [...l, item]);
    setMonto(''); setNota('');
  }

  function pedirAnulacion(item) {
    setAnulando(item);
    setMotivoAnulacion('');
  }

  async function confirmarAnulacion() {
    if (!motivoAnulacion.trim()) return show('⚠ Ingresá un motivo');
    try {
      const sb = getClient();
      // Guardar en Supabase como anulada si ya tiene id de DB
      if (anulando.db_id) {
        await sb.from('ingresos')
          .update({ anulada: true, motivo_anulacion: motivoAnulacion })
          .eq('id', anulando.db_id);
      } else {
        // Guardar como anulada directamente
        await sb.from('ingresos').insert([{
          bar_id:           usuario.bar_id,
          turno_id:         null,
          usuario_id:       usuario.id,
          medio_pago:       anulando.medio_pago,
          monto_bruto:      anulando.monto_bruto,
          retencion_pct:    anulando.retencion_pct,
          retencion_monto:  anulando.retencion_monto,
          monto_neto:       anulando.monto_neto,
          nota:             anulando.nota || '',
          fecha:            new Date().toISOString(),
          anulada:          true,
          motivo_anulacion: motivoAnulacion,
        }]);
      }
      setLista(l => l.map(i => i._id === anulando._id ? { ...i, anulada: true, motivo_anulacion: motivoAnulacion } : i));
      setAnulando(null);
      show('✓ Venta anulada y registrada');
    } catch {
      show('✗ Error al registrar anulación');
    }
  }

  async function cerrarTurnoHandler() {
    if (activas.length === 0) return show('⚠ No hay ventas para cerrar');
    setCerrando(true);
    try {
      const t = await abrirTurno(usuario.bar_id, usuario.id, todayStr(), turno);
      const rows = activas.map(item => ({
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
        anulada:         false,
        motivo_anulacion: '',
      }));
      await crearIngresosBulk(rows);
      await cerrarTurno(t.id);
      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      show(`✓ Turno cerrado · ${activas.length} ventas · ${fmt(totalBruto)} bruto`);
    } catch {
      show('✗ Error al cerrar turno');
    } finally {
      setCerrando(false);
    }
  }

  if (!config) return <Spinner />;

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {/* Modal anulación */}
      {anulando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-8 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-5 flex flex-col gap-4 shadow-xl">
            <div>
              <div className="text-base font-bold text-t1">Anular venta</div>
              <div className="text-sm text-t3 mt-1">
                {anulando.medio_label} · {fmt(anulando.monto_bruto)}
              </div>
            </div>
            <div>
              <FieldLabel>Motivo de anulación</FieldLabel>
              <textarea
                value={motivoAnulacion}
                onChange={e => setMotivoAnulacion(e.target.value)}
                placeholder="Ej: error de carga, cliente canceló..."
                rows={3}
                className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-red/40 placeholder:text-t4 transition resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAnulando(null)}
                className="flex-1 h-11 rounded-xl bg-offset text-t2 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={confirmarAnulacion}
                className="flex-1 h-11 rounded-xl bg-redsoft border border-red/20 text-redtext text-sm font-semibold">
                Confirmar anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turno */}
      <Card>
        <div className="p-4">
          <FieldLabel>Turno</FieldLabel>
          <ChipGroup
            options={TURNOS.map(t => ({ value: t.key, label: `${t.icon} ${t.label}` }))}
            value={turno} onChange={setTurno}
          />
        </div>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader title="Nueva venta" subtitle="Se agrega a la lista del turno" />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>Medio de pago</FieldLabel>
            <ChipGroup
              options={MEDIOS_PAGO.map(m => ({ value: m.key, label: m.label, color: m.color }))}
              value={medio} onChange={setMedio}
            />
          </div>
          <div>
            <FieldLabel>Monto bruto</FieldLabel>
            <MontoInput value={monto} onChange={setMonto}
              color={medio ? MEDIOS_PAGO.find(m => m.key === medio)?.color : null} />
          </div>
          {preview && (
            <div className="bg-offset rounded-xl border border-divider p-3 flex flex-col gap-0">
              <DivRow label="Monto bruto" value={fmt(preview.monto_bruto)} />
              {preview.retencion_pct > 0 && (
                <DivRow label={`Retención (${preview.retencion_pct}%)`}
                  value={`−${fmt(preview.retencion_monto)}`} valueClass="text-redtext" />
              )}
              <DivRow label="Monto neto" value={fmt(preview.monto_neto)} valueClass="text-greentext" bold />
            </div>
          )}
          <div>
            <FieldLabel>Nota (opcional)</FieldLabel>
            <input value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Mesa 5, delivery, etc..."
              className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4" />
          </div>
          <button onClick={agregarALista}
            className="w-full h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm active:scale-[0.98] transition-all">
            + Agregar a lista
          </button>
        </div>
      </Card>

      {/* Lista activa */}
      {activas.length > 0 && (
        <Card>
          <CardHeader title={`Lista · ${activas.length} ventas`}
            subtitle={`${fmt(totalBruto)} bruto`} />
          <div className="p-4 flex flex-col gap-2">
            {activas.map(item => (
              <div key={item._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-offset border border-divider">
                <div className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.medio_color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-t1">{item.medio_label}</div>
                  {item.nota && <div className="text-xs text-t3 truncate">{item.nota}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums text-t1">{fmt(item.monto_bruto)}</div>
                  {item.retencion_monto > 0 && (
                    <div className="text-xs text-redtext tabular-nums">−{fmt(item.retencion_monto)}</div>
                  )}
                </div>
                <button onClick={() => pedirAnulacion(item)}
                  className="w-8 h-8 rounded-lg bg-redsoft flex items-center justify-center text-redtext text-sm flex-shrink-0">
                  ✕
                </button>
              </div>
            ))}

            <div className="mt-1 bg-offset rounded-xl border border-divider p-3">
              <DivRow label="Total bruto"       value={fmt(totalBruto)} />
              <DivRow label="Total retenciones" value={`−${fmt(totalRetencion)}`} valueClass="text-redtext" />
              <DivRow label="Total neto"        value={fmt(totalNeto)} valueClass="text-greentext" bold />
            </div>

            <BtnPrimary
              label={cerrando ? 'Cerrando...' : `✓ Cerrar turno · ${activas.length} ventas`}
              onClick={cerrarTurnoHandler} loading={cerrando} className="mt-1"
            />
            <BtnSecondary label="Limpiar todo" onClick={() => { setLista([]); localStorage.removeItem(STORAGE_KEY); }} />
          </div>
        </Card>
      )}

      {/* Anuladas del turno */}
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
