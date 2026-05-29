// src/app/(app)/resumen/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import {
  getIngresosDia, getEgresosDia, getResumenMes,
  calcularResumenDia, fmt, todayStr
} from '../../../lib/data';
import { MEDIOS_PAGO, TIPOS_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, KpiCard, ResultadoCard,
  TablaRetencion, EmptyState, Spinner, Badge, DivRow, Select
} from '../../../components/ui';

const MESES_OPCIONES = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: format(d, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase()),
      año:   d.getFullYear(),
      mes:   d.getMonth() + 1,
    };
  });
};

export default function ResumenPage() {
  const { usuario } = useAuth();
  const [modo, setModo] = useState('dia');
  const [fecha, setFecha] = useState(todayStr());
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [loadingDia, setLoadingDia] = useState(false);
  const meses = MESES_OPCIONES();
  const [mesSel, setMesSel] = useState(meses[0].value);
  const [resMes, setResMes] = useState(null);
  const [loadingMes, setLoadingMes] = useState(false);
  const esHoy = fecha === todayStr();

  const cargarDia = useCallback(async () => {
    if (!usuario) return;
    setLoadingDia(true);
    try {
      const [ing, egr] = await Promise.all([
        getIngresosDia(usuario.bar_id, fecha),
        getEgresosDia(usuario.bar_id, fecha),
      ]);
      setIngresos(ing); setEgresos(egr);
    } finally { setLoadingDia(false); }
  }, [usuario, fecha]);

  const cargarMes = useCallback(async () => {
    if (!usuario) return;
    const m = meses.find(x => x.value === mesSel);
    if (!m) return;
    setLoadingMes(true);
    try {
      const res = await getResumenMes(usuario.bar_id, m.año, m.mes);
      setResMes(res);
    } finally { setLoadingMes(false); }
  }, [usuario, mesSel]);

  useEffect(() => { if (modo === 'dia') cargarDia(); }, [modo, cargarDia]);
  useEffect(() => { if (modo === 'mes') cargarMes(); }, [modo, cargarMes]);

  const ingresosActivos = ingresos.filter(i => !i.anulada);
  const ingresosAnulados = ingresos.filter(i => i.anulada);
  const resDia = calcularResumenDia(ingresos, egresos);

  function getIngTurno(t) {
  return ingresosActivos.filter(i => {
    const num = i.turnos?.numero ?? 'sin_turno';
    return num === t;
  });
}
function getEgrTurno(t) {
  return egresos.filter(e => {
    const num = e.turnos?.numero ?? 'sin_turno';
    return num === t;
  });
}

  const turnosKeys = ['1', '2', 'sin_turno'];
  const turnosConDatos = turnosKeys.filter(t => getIngTurno(t).length > 0 || getEgrTurno(t).length > 0);
  const turnoLabel = { '1': 'Turno 1 ☀️', '2': 'Turno 2 🌙', 'sin_turno': 'Sin turno' };
  const mesObj = meses.find(x => x.value === mesSel);

  const retRowsMes = resMes ? MEDIOS_PAGO.filter(m => resMes.porMedio[m.key]).map(m => ({
    label: m.label, color: m.color,
    bruto: resMes.porMedio[m.key].bruto,
    retencion: resMes.porMedio[m.key].retencion,
    neto: resMes.porMedio[m.key].neto,
  })) : [];

  return (
    <Screen>
      <div className="flex bg-offset rounded-2xl p-1 gap-1">
        <button onClick={() => setModo('dia')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${modo === 'dia' ? 'bg-surface shadow-card text-t1' : 'text-t3'}`}>
          Por día
        </button>
        <button onClick={() => setModo('mes')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${modo === 'mes' ? 'bg-surface shadow-card text-t1' : 'text-t3'}`}>
          Por mes
        </button>
      </div>

      {modo === 'dia' && (<>
        <div className="flex items-center gap-2 bg-surface rounded-2xl shadow-card p-3">
          <button onClick={() => setFecha(d => subDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-offset text-xl font-bold">‹</button>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-t1 capitalize">
              {format(new Date(fecha+'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </span>
            {esHoy && <Badge label="Hoy" variant="success" />}
          </div>
          <button onClick={() => setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
            disabled={esHoy}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-offset text-xl font-bold disabled:opacity-30">›</button>
        </div>

        {loadingDia ? <Spinner /> : (<>
          {ingresosActivos.length === 0 && egresos.length === 0
            ? <EmptyState message="Sin movimientos este día" />
            : (<>
                {turnosConDatos.map(t => {
                  const ingT = getIngTurno(t);
                  const egrT = getEgrTurno(t);
                  const ventasBrutas = ingT.reduce((s, i) => s + i.monto_bruto, 0);
                  const retenciones  = ingT.reduce((s, i) => s + i.retencion_monto, 0);
                  const ventasNetas  = ingT.reduce((s, i) => s + i.monto_neto, 0);
                  const gastosTurno  = egrT.reduce((s, e) => s + e.monto, 0);
                  const resultTurno  = ventasBrutas - gastosTurno;
                  const porMedio = {};
                  for (const ing of ingT) {
                    if (!porMedio[ing.medio_pago]) porMedio[ing.medio_pago] = { bruto: 0, retencion: 0, neto: 0 };
                    porMedio[ing.medio_pago].bruto     += ing.monto_bruto;
                    porMedio[ing.medio_pago].retencion += ing.retencion_monto;
                    porMedio[ing.medio_pago].neto      += ing.monto_neto;
                  }
                  return (
                    <Card key={t}>
                      <CardHeader title={turnoLabel[t]} subtitle={`${ingT.length} ventas · ${fmt(ventasBrutas)} bruto`} />
                      <div className="p-4 flex flex-col gap-4">
                        {Object.keys(porMedio).length > 0 && (
                          <div>
                            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-2">Ventas por medio de pago</div>
                            <TablaRetencion rows={MEDIOS_PAGO.filter(m => porMedio[m.key]).map(m => ({
                              label: m.label, color: m.color,
                              bruto: porMedio[m.key].bruto,
                              retencion: porMedio[m.key].retencion,
                              neto: porMedio[m.key].neto,
                            }))} />
                          </div>
                        )}
                        {egrT.length > 0 && (
                          <div>
                            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-2">Gastos</div>
                            {egrT.map(e => {
                              const tipo = TIPOS_EGRESO.find(te => te.key === e.tipo);
                              return (
                                <div key={e.id} className="flex justify-between py-2 border-b border-divider last:border-0">
                                  <span className="text-sm text-t2">{tipo?.label || e.tipo}{e.detalle ? ` · ${e.detalle}` : ''}</span>
                                  <span className="text-sm font-semibold text-ambertext tabular-nums">−{fmt(e.monto)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="bg-offset rounded-xl p-3">
                          <DivRow label="Venta bruta" value={fmt(ventasBrutas)} />
                          {retenciones > 0 && <DivRow label="Retenciones" value={`−${fmt(retenciones)}`} valueClass="text-redtext" />}
                          <DivRow label="Venta neta" value={fmt(ventasNetas)} valueClass="text-greentext" />
                          {gastosTurno > 0 && <DivRow label="Gastos" value={`−${fmt(gastosTurno)}`} valueClass="text-ambertext" />}
                          <DivRow label="Resultado" value={`${resultTurno >= 0 ? '' : '−'}${fmt(Math.abs(resultTurno))}`}
                            valueClass={resultTurno >= 0 ? 'text-greentext' : 'text-redtext'} bold />
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {ingresosAnulados.length > 0 && (
                  <Card>
                    <CardHeader title="Anulaciones" subtitle={`${ingresosAnulados.length} registros`} />
                    <div className="p-4 flex flex-col gap-2">
                      {ingresosAnulados.map(i => {
                        const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                        return (
                          <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-redsoft border border-red/10">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-t2 line-through">{m?.label} · {fmt(i.monto_bruto)}</div>
                              <div className="text-xs text-redtext mt-0.5">{i.fecha?.slice(11,16)} · {i.motivo_anulacion}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {turnosConDatos.length > 1 && (
                  <Card>
                    <CardHeader title="Total del día" />
                    <div className="p-4">
                      <DivRow label="Venta bruta total" value={fmt(resDia.totalBruto)} />
                      {resDia.totalRetencion > 0 && <DivRow label="Retenciones" value={`−${fmt(resDia.totalRetencion)}`} valueClass="text-redtext" />}
                      <DivRow label="Venta neta total" value={fmt(resDia.totalNeto)} valueClass="text-greentext" />
                      {resDia.totalEgresos > 0 && <DivRow label="Gastos" value={`−${fmt(resDia.totalEgresos)}`} valueClass="text-ambertext" />}
                      <DivRow label="Resultado" value={`${resDia.resultado >= 0 ? '' : '−'}${fmt(Math.abs(resDia.resultado))}`}
                        valueClass={resDia.resultado >= 0 ? 'text-greentext' : 'text-redtext'} bold />
                    </div>
                  </Card>
                )}
              </>)
          }
        </>)}
      </>)}

      {modo === 'mes' && (<>
        <Card>
          <div className="p-4">
            <Select value={mesSel} onChange={setMesSel}
              options={meses.map(m => ({ value: m.value, label: m.label }))} />
          </div>
        </Card>

        {loadingMes ? <Spinner /> : resMes && (<>
          <div className="text-center">
            <div className="text-lg font-black text-t1 capitalize">{mesObj?.label}</div>
            {resMes.totalBruto > 0 && (
              <div className="text-sm text-t3 mt-0.5">
                Rentabilidad: <span className="text-greentext font-semibold">
                  {((resMes.resultado / resMes.totalBruto) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <KpiCard label="Ventas brutas" value={resMes.totalBruto} color="green" />
            <KpiCard label="Retenciones" value={resMes.totalRetencion} color="red" />
          </div>
          <div className="flex gap-3">
            <KpiCard label="Ventas netas" value={resMes.totalNeto} />
            <KpiCard label="Gastos" value={resMes.totalEgresos} color="amber" />
          </div>
          <ResultadoCard valor={resMes.resultado} label="Resultado del mes" />
          {retRowsMes.length > 0 && (
            <Card>
              <CardHeader title="Ventas por medio de pago" />
              <div className="p-4">
                <TablaRetencion rows={retRowsMes} />
              </div>
            </Card>
          )}
        </>)}
      </>)}
    </Screen>
  );
}
