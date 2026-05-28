// src/app/(app)/resumen/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import {
  getMovimientosMes, getIngresosDia, getEgresosDia,
  calcularResumenDia, fmt, todayStr
} from '../../../lib/data';
import { MEDIOS_PAGO, TIPOS_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, KpiCard, ResultadoCard,
  TablaRetencion, BreakdownBar, EmptyState, Spinner,
  DivRow, Badge
} from '../../../components/ui';

export default function ResumenPage() {
  const { usuario } = useAuth();
  const now     = new Date();
  const [año]   = useState(now.getFullYear());
  const [mes]   = useState(now.getMonth() + 1);
  const [diaSeleccionado, setDia] = useState(null);

  const [movsMes, setMovsMes]       = useState(null);
  const [movsDia, setMovsDia]       = useState(null);
  const [loadingMes, setLoadingMes] = useState(true);
  const [loadingDia, setLoadingDia] = useState(false);

  // Cargar mes completo
  useEffect(() => {
    if (!usuario) return;
    setLoadingMes(true);
    getMovimientosMes(usuario.bar_id, año, mes)
      .then(setMovsMes)
      .finally(() => setLoadingMes(false));
  }, [usuario, año, mes]);

  // Cargar día seleccionado
  useEffect(() => {
    if (!diaSeleccionado || !usuario) return;
    setLoadingDia(true);
    Promise.all([
      getIngresosDia(usuario.bar_id, diaSeleccionado),
      getEgresosDia(usuario.bar_id, diaSeleccionado),
    ]).then(([ing, egr]) => setMovsDia({ ingresos: ing, egresos: egr }))
      .finally(() => setLoadingDia(false));
  }, [diaSeleccionado, usuario]);

  const resMes = movsMes ? calcularResumenDia(movsMes.ingresos, movsMes.egresos) : null;
  const resDia = movsDia ? calcularResumenDia(movsDia.ingresos, movsDia.egresos) : null;

  // Agrupar movimientos del mes por día
  const diasConMovimientos = movsMes ? (() => {
    const map = {};
    [...movsMes.ingresos, ...movsMes.egresos].forEach(m => {
      const d = m.fecha.slice(0, 10);
      if (!map[d]) map[d] = { ingresos: [], egresos: [] };
      if (m.medio_pago) map[d].ingresos.push(m);
      else map[d].egresos.push(m);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  })() : [];

  const mesLabel = format(new Date(año, mes-1, 1), 'MMMM yyyy', { locale: es });
  const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  return (
    <Screen>
      {loadingMes ? <Spinner /> : (<>

        {/* Header mes */}
        <div className="text-center">
          <div className="text-lg font-black text-t1 tracking-tight capitalize">{mesLabel}</div>
          <div className="text-xs text-t3 mt-0.5">Mes en curso</div>
        </div>

        {/* KPIs mes */}
        <div className="flex gap-3">
          <KpiCard label="Ventas brutas" value={resMes?.totalBruto || 0} color="green" />
          <KpiCard label="Retenciones" value={resMes?.totalRetencion || 0} color="red" />
        </div>
        <div className="flex gap-3">
          <KpiCard label="Ventas netas" value={resMes?.totalNeto || 0} />
          <KpiCard label="Gastos" value={resMes?.totalEgresos || 0} color="amber" />
        </div>

        <ResultadoCard valor={resMes?.resultado || 0} label="Resultado del mes" />

        {/* Desglose por medio */}
        {resMes && Object.keys(resMes.porMedio).length > 0 && (
          <Card>
            <CardHeader title="Ventas por medio de pago" />
            <div className="p-4">
              <TablaRetencion rows={
                MEDIOS_PAGO.filter(m => resMes.porMedio[m.key]).map(m => ({
                  label: m.label, color: m.color,
                  bruto: resMes.porMedio[m.key].bruto,
                  retencion: resMes.porMedio[m.key].retencion,
                  neto: resMes.porMedio[m.key].neto,
                }))
              } />
            </div>
          </Card>
        )}

        {/* Lista de días del mes */}
        <Card>
          <CardHeader title="Por día" subtitle="Tocá un día para ver el detalle" />
          <div className="p-4">
            {diasConMovimientos.length === 0
              ? <EmptyState message="Sin movimientos este mes" />
              : diasConMovimientos.map(([dia, movs]) => {
                  const r = calcularResumenDia(movs.ingresos, movs.egresos);
                  const d = new Date(dia + 'T12:00:00');
                  const pos = r.resultado >= 0;
                  const isSelected = diaSeleccionado === dia;
                  return (
                    <div key={dia}>
                      <button
                        onClick={() => setDia(isSelected ? null : dia)}
                        className={`w-full flex items-center gap-3 py-3 border-b border-white/[0.06]
                          last:border-0 text-left ${isSelected ? 'opacity-100' : 'opacity-90'}`}>
                        <div className={`w-0.5 h-9 rounded-full flex-shrink-0
                          ${pos ? 'bg-green' : 'bg-red'}`} />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-t1">
                            {DAY_NAMES[d.getDay()]} {d.getDate()}
                          </div>
                          <div className="text-xs text-t3 mt-0.5">
                            {movs.ingresos.length} ventas · {movs.egresos.length} gastos
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-extrabold tabular-nums
                            ${pos ? 'text-greentext' : 'text-redtext'}`}>
                            {r.resultado < 0 && '−'}{fmt(Math.abs(r.resultado))}
                          </div>
                          <div className="text-xs text-t3 tabular-nums">{fmt(r.totalBruto)} bruto</div>
                        </div>
                        <span className="text-t3 text-sm">{isSelected ? '▲' : '▶'}</span>
                      </button>

                      {/* Detalle del día expandido */}
                      {isSelected && (
                        <div className="mb-3 bg-offset rounded-xl border border-white/10 p-4 flex flex-col gap-3">
                          {loadingDia ? <Spinner /> : resDia && (<>
                            <div className="flex gap-2">
                              <div className="flex-1 text-center">
                                <div className="text-[10px] text-t3 uppercase tracking-wider">Bruto</div>
                                <div className="text-sm font-bold text-t1 tabular-nums">{fmt(resDia.totalBruto)}</div>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-[10px] text-t3 uppercase tracking-wider">Retención</div>
                                <div className="text-sm font-bold text-redtext tabular-nums">−{fmt(resDia.totalRetencion)}</div>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-[10px] text-t3 uppercase tracking-wider">Neto</div>
                                <div className="text-sm font-bold text-greentext tabular-nums">{fmt(resDia.totalNeto)}</div>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-[10px] text-t3 uppercase tracking-wider">Gastos</div>
                                <div className="text-sm font-bold text-ambertext tabular-nums">−{fmt(resDia.totalEgresos)}</div>
                              </div>
                            </div>
                            {/* Por medio de pago */}
                            {Object.keys(resDia.porMedio).length > 0 && (
                              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
                                {MEDIOS_PAGO.filter(m => resDia.porMedio[m.key]).map(m => (
                                  <div key={m.key} className="flex justify-between text-xs">
                                    <span className="text-t2 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: m.color }} />
                                      {m.label}
                                    </span>
                                    <span className="text-t1 tabular-nums font-medium">
                                      {fmt(resDia.porMedio[m.key].neto)} neto
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>)}
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </Card>

      </>)}
    </Screen>
  );
}
