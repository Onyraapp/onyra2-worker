// src/app/(app)/dashboard/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import {
  getIngresosDia, getEgresosDia, calcularResumenDia,
  fmt, todayStr
} from '../../../lib/data';
import { MEDIOS_PAGO, TIPOS_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, KpiCard, ResultadoCard,
  TablaRetencion, BreakdownBar, EmptyState, Spinner,
  BtnPrimary, Badge, DivRow
} from '../../../components/ui';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [fecha, setFecha] = useState(todayStr());
  const [ingresos, setIngresos] = useState([]);
  const [egresos,  setEgresos]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const [ing, egr] = await Promise.all([
        getIngresosDia(usuario.bar_id, fecha),
        getEgresosDia(usuario.bar_id, fecha),
      ]);
      setIngresos(ing); setEgresos(egr);
    } finally { setLoading(false); }
  }, [usuario, fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const esHoy  = fecha === todayStr();
  const res    = calcularResumenDia(ingresos, egresos);
  const fechaDisplay = format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es });

  // Rows para tabla de retenciones
  const retRows = MEDIOS_PAGO
    .filter(m => res.porMedio[m.key])
    .map(m => ({
      label:    m.label,
      color:    m.color,
      bruto:    res.porMedio[m.key].bruto,
      retencion:res.porMedio[m.key].retencion,
      neto:     res.porMedio[m.key].neto,
    }));

  // Egresos por tipo
  const egresosPorTipo = egresos.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + e.monto;
    return acc;
  }, {});

  return (
    <Screen>
      {/* Date selector */}
      <div className="flex items-center gap-2 bg-surface rounded-2xl border border-white/10 p-3">
        <button onClick={() => setFecha(d => subDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-white/5 text-xl font-bold">
          ‹
        </button>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-t1 capitalize">{fechaDisplay}</span>
          {esHoy && <Badge label="Hoy" variant="success" />}
        </div>
        <button onClick={() => setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          disabled={esHoy}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-white/5 text-xl font-bold disabled:opacity-30">
          ›
        </button>
      </div>

      {loading ? <Spinner /> : (<>

        {/* KPIs */}
        <div className="flex gap-3">
          <KpiCard label="Ventas brutas" value={res.totalBruto} color="green" />
          <KpiCard label="Retenciones" value={res.totalRetencion} color="red"
            sub={res.totalBruto > 0 ? ((res.totalRetencion/res.totalBruto)*100).toFixed(1)+'%' : '0%'} />
        </div>
        <div className="flex gap-3">
          <KpiCard label="Ventas netas" value={res.totalNeto} />
          <KpiCard label="Gastos" value={res.totalEgresos} color="amber" />
        </div>

        <ResultadoCard valor={res.resultado} />

        {/* Desglose por medio de pago */}
        {retRows.length > 0 && (
          <Card>
            <CardHeader title="Ventas por medio de pago"
              subtitle="Bruto · Retención · Neto" />
            <div className="p-4">
              <TablaRetencion rows={retRows} />
            </div>
          </Card>
        )}

        {/* Egresos por tipo */}
        {egresos.length > 0 && (
          <Card>
            <CardHeader title="Gastos del día"
              subtitle={`${egresos.length} movimientos · ${fmt(res.totalEgresos)}`} />
            <div className="p-4 flex flex-col gap-3">
              {TIPOS_EGRESO
                .filter(t => egresosPorTipo[t.key])
                .map(t => (
                  <BreakdownBar key={t.key}
                    label={t.label}
                    value={egresosPorTipo[t.key]}
                    total={res.totalEgresos}
                    color="#f59e0b"
                  />
                ))}
            </div>
          </Card>
        )}
{/* Anulaciones del día - solo admin */}
{usuario?.rol === 'admin' && ingresos.filter(i => i.anulada).length > 0 && (
  <Card>
    <CardHeader
      title="Anulaciones del día"
      subtitle={`${ingresos.filter(i => i.anulada).length} registros`}
    />
    <div className="p-4 flex flex-col gap-2">
      {ingresos.filter(i => i.anulada).map(i => {
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
        {/* Lista movimientos */}
        <Card>
          <CardHeader title="Movimientos"
            subtitle={`${ingresos.length + egresos.length} registros`} />
          <div className="p-4 flex flex-col gap-2">
            {ingresos.length === 0 && egresos.length === 0
              ? <EmptyState message="Sin movimientos este día" />
              : (<>
                  {ingresos.map(i => {
                    const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                    return (
                      <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0"
                          style={{ backgroundColor: m?.color || '#22c55e' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-t1">{m?.label}</div>
                          <div className="text-xs text-t3 mt-0.5">
                            {i.fecha?.slice(11,16)}
                            {i.turnos?.numero && i.turnos.numero !== 'sin_turno' && ` · T${i.turnos.numero}`}
                            {i.retencion_pct > 0 && ` · ${i.retencion_pct}% ret.`}
                          </div>
                          {i.nota && <div className="text-xs text-t2 mt-0.5 italic truncate">{i.nota}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-extrabold tabular-nums text-greentext">{fmt(i.monto_bruto)}</div>
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
                      <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0 bg-amber" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-t1">{t?.label || e.tipo}</div>
                          <div className="text-xs text-t3 mt-0.5">
                            {e.fecha?.slice(11,16)}
                            {e.turnos?.numero && e.turnos.numero !== 'sin_turno' && ` · T${e.turnos.numero}`}
                          </div>
                          {e.detalle && <div className="text-xs text-t2 mt-0.5 italic truncate">{e.detalle}</div>}
                        </div>
                        <div className="text-sm font-extrabold tabular-nums text-ambertext flex-shrink-0">
                          −{fmt(e.monto)}
                        </div>
                      </div>
                    );
                  })}
                </>)
            }
          </div>
        </Card>

        {/* Acciones */}
        <BtnPrimary label="+ Cargar venta" onClick={() => router.push('/cargar')} />
        <div className="flex gap-2">
          <button onClick={() => router.push('/egresos')}
            className="flex-1 h-11 rounded-xl bg-surface border border-white/10 text-t1 text-sm font-semibold">
            − Registrar gasto
          </button>
        </div>

      </>)}
    </Screen>
  );
}
