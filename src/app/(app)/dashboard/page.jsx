// src/app/(app)/dashboard/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import {
  getIngresosDia, getEgresosDia, calcularResumenDia,
  getConfiguracion, getCierreDiario, crearCierreDiario,
  fmt, todayStr
} from '../../../lib/data';
import { MEDIOS_PAGO, TIPOS_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, KpiCard, ResultadoCard,
  TablaRetencion, BreakdownBar, EmptyState, Spinner,
  BtnPrimary, Badge, DivRow, Toast, useToast
} from '../../../components/ui';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const { toast, visible, show } = useToast();
  const [fecha,      setFecha]      = useState(todayStr());
  const [ingresos,   setIngresos]   = useState([]);
  const [egresos,    setEgresos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [diaCerrado, setDiaCerrado] = useState(false);
  const [cerrandoDia, setCerrandoDia] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const [ing, egr, cierre] = await Promise.all([
        getIngresosDia(usuario.bar_id, fecha),
        getEgresosDia(usuario.bar_id, fecha),
        getCierreDiario(usuario.bar_id, fecha),
      ]);
      setIngresos(ing); setEgresos(egr);
      setDiaCerrado(!!cierre);
    } finally { setLoading(false); }
  }, [usuario, fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const esHoy  = fecha === todayStr();
  const res    = calcularResumenDia(ingresos, egresos);
  const fechaDisplay = format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es });

  const ingresosActivos  = ingresos.filter(i => !i.anulada);
  const ingresosAnulados = ingresos.filter(i => i.anulada);

  const retRows = MEDIOS_PAGO
    .filter(m => res.porMedio[m.key])
    .map(m => ({
      label: m.label, color: m.color,
      bruto:     res.porMedio[m.key].bruto,
      retencion: res.porMedio[m.key].retencion,
      neto:      res.porMedio[m.key].neto,
    }));

  const egresosPorTipo = egresos.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + e.monto;
    return acc;
  }, {});

  async function cierreDiario() {
    if (diaCerrado) return;
    setCerrandoDia(true);
    try {
      const [ing, egr, cfg] = await Promise.all([
        getIngresosDia(usuario.bar_id, todayStr()),
        getEgresosDia(usuario.bar_id, todayStr()),
        getConfiguracion(usuario.bar_id),
      ]);
      const r = calcularResumenDia(ing, egr);
      const fechaLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      const pos = r.resultado >= 0;
      const msg = [
        `*CajaBar - Cierre del ${fechaLabel}*`, ``,
        `Ventas brutas:  ${fmt(r.totalBruto)}`,
        `Retenciones:    -${fmt(r.totalRetencion)}`,
        `Ventas netas:   ${fmt(r.totalNeto)}`,
        `Gastos:         -${fmt(r.totalEgresos)}`, ``,
        `Resultado: *${r.resultado >= 0 ? '' : '-'}${fmt(Math.abs(r.resultado))}*`, ``,
        `_${ing.filter(i => !i.anulada).length} ventas - ${ing.filter(i => i.anulada).length} anulaciones_`,
      ].join('\n');
      const numero = cfg?.whatsapp_numero?.trim();
      const url = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      await crearCierreDiario(usuario.bar_id, usuario.id, todayStr());
      setDiaCerrado(true);
      show('✓ Día cerrado · WhatsApp enviado');
    } catch (e) {
      if (e?.code === '23505') { setDiaCerrado(true); show('El día ya estaba cerrado'); }
      else show('✗ Error al cerrar el día');
    } finally { setCerrandoDia(false); }
  }

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      <div className="flex items-center gap-2 bg-surface rounded-2xl shadow-card p-3">
        <button onClick={() => setFecha(d => subDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-offset text-xl font-bold">‹</button>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-t1 capitalize">{fechaDisplay}</span>
          <div className="flex gap-1.5">
            {esHoy && <Badge label="Hoy" variant="success" />}
            {diaCerrado && <Badge label="Cerrado" variant="danger" />}
          </div>
        </div>
        <button onClick={() => setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          disabled={esHoy}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-offset text-xl font-bold disabled:opacity-30">›</button>
      </div>

      {loading ? <Spinner /> : (<>

        <div className="flex gap-3">
          <KpiCard label="Ventas brutas" value={res.totalBruto} color="green" />
          <KpiCard label="Retenciones"   value={res.totalRetencion} color="red"
            sub={res.totalBruto > 0 ? ((res.totalRetencion/res.totalBruto)*100).toFixed(1)+'%' : '0%'} />
        </div>
        <div className="flex gap-3">
          <KpiCard label="Ventas netas" value={res.totalNeto} />
          <KpiCard label="Gastos"       value={res.totalEgresos} color="amber" />
        </div>

        <ResultadoCard valor={res.resultado} />

        {retRows.length > 0 && (
          <Card>
            <CardHeader title="Por medio de pago" subtitle="Bruto · Retención · Neto" />
            <div className="p-4">
              <TablaRetencion rows={retRows} />
            </div>
          </Card>
        )}

        {egresos.length > 0 && (
          <Card>
            <CardHeader title="Gastos del día"
              subtitle={`${egresos.length} movimientos · ${fmt(res.totalEgresos)}`} />
            <div className="p-4 flex flex-col gap-3">
              {TIPOS_EGRESO.filter(t => egresosPorTipo[t.key]).map(t => (
                <BreakdownBar key={t.key} label={t.label}
                  value={egresosPorTipo[t.key]} total={res.totalEgresos} color="#FF9500" />
              ))}
            </div>
          </Card>
        )}

        {usuario?.rol === 'admin' && ingresosAnulados.length > 0 && (
          <Card>
            <CardHeader title="Anulaciones del día"
              subtitle={`${ingresosAnulados.length} registros`} />
            <div className="p-4 flex flex-col gap-2">
              {ingresosAnulados.map(i => {
                const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                return (
                  <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-redsoft border border-red/10">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-t2 line-through">{m?.label} · {fmt(i.monto_bruto)}</div>
                      <div className="text-xs text-t3 mt-0.5">{i.fecha?.slice(11,16)} · {i.motivo_anulacion}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Movimientos"
            subtitle={`${ingresosActivos.length + egresos.length} registros`} />
          <div className="p-4 flex flex-col gap-2">
            {ingresosActivos.length === 0 && egresos.length === 0
              ? <EmptyState message="Sin movimientos este día" />
              : (<>
                  {ingresosActivos.map(i => {
                    const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                    return (
                      <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                        <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0"
                          style={{ backgroundColor: m?.color || '#34C759' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-t1">{m?.label}</div>
                          <div className="text-xs text-t3 mt-0.5">
                            {i.fecha?.slice(11,16)}
                            {i.retencion_pct > 0 && ` · ${i.retencion_pct}% ret.`}
                          </div>
                          {i.nota && <div className="text-xs text-t2 mt-0.5 italic truncate">{i.nota}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold tabular-nums text-greentext">{fmt(i.monto_bruto)}</div>
                          {i.retencion_monto > 0 && (
                            <div className="text-xs text-redtext tabular-nums">−{fmt(i.retencion_monto)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {egresos.map(e => {
                    const t = TIPOS_EGRESO.find(te => te.key === e.tipo);
                    return (
                      <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                        <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0 bg-amber" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-t1">{t?.label || e.tipo}</div>
                          <div className="text-xs text-t3 mt-0.5">{e.fecha?.slice(11,16)}</div>
                          {e.detalle && <div className="text-xs text-t2 mt-0.5 italic truncate">{e.detalle}</div>}
                        </div>
                        <div className="text-sm font-bold tabular-nums text-ambertext flex-shrink-0">
                          −{fmt(e.monto)}
                        </div>
                      </div>
                    );
                  })}
                </>)
            }
          </div>
        </Card>

        <BtnPrimary label="+ Cargar venta" onClick={() => router.push('/cargar')} />
        <div className="flex gap-2">
          <button onClick={() => router.push('/egresos')}
            className="flex-1 h-11 rounded-xl bg-surface shadow-card border border-border text-t1 text-sm font-medium">
            − Registrar gasto
          </button>
          <button
            onClick={cierreDiario}
            disabled={cerrandoDia || diaCerrado || !esHoy}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40
              ${diaCerrado ? 'bg-offset text-t3 border border-divider' : 'bg-green text-white'}`}>
            {cerrandoDia ? '...' : diaCerrado ? '✓ Cerrado' : '📲 Cierre diario'}
          </button>
        </div>

      </>)}
    </Screen>
  );
}
