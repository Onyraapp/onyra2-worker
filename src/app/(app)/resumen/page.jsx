// src/app/(app)/resumen/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ptBR from 'date-fns/locale/pt-BR';
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
import { useLocale } from '../../../hooks/useLocale';

export default function ResumenPage() {
  const { usuario } = useAuth();
  const { t, isPT, fmt: fmtL } = useLocale();
  const dateLocale = isPT ? ptBR : es;

  const MESES_OPCIONES = () => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        value: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: format(d, 'MMMM yyyy', { locale: dateLocale }).replace(/^\w/, c => c.toUpperCase()),
        año:   d.getFullYear(),
        mes:   d.getMonth() + 1,
      };
    });
  };

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

  const turnoLabel = {
    '1': `Turno 1 ☀️`,
    '2': `Turno 2 🌙`,
    'sin_turno': isPT ? 'Turno único' : 'Sin turno'
  };

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

  const ingresosActivos  = ingresos.filter(i => !i.anulada);
  const ingresosAnulados = ingresos.filter(i => i.anulada);
  const egresosFiltrados = usuario?.rol === 'admin'
    ? egresos
    : egresos.filter(e => e.tipo !== 'retiros');
  const resDia = calcularResumenDia(ingresos, egresosFiltrados);

  function getIngTurno(turno) {
    return ingresosActivos.filter(i => {
      const num = i.turnos?.numero ?? 'sin_turno';
      return num === turno;
    });
  }

  function getEgrTurno(turno) {
    return egresos.filter(e => {
      const num = e.turnos?.numero ?? 'sin_turno';
      return num === turno;
    });
  }

  const turnosKeys = ['1', '2', 'sin_turno'];
  const turnosConDatos = turnosKeys.filter(turno => getIngTurno(turno).length > 0 || getEgrTurno(turno).length > 0);

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
          {isPT ? 'Por dia' : 'Por día'}
        </button>
        <button onClick={() => setModo('mes')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${modo === 'mes' ? 'bg-surface shadow-card text-t1' : 'text-t3'}`}>
          {isPT ? 'Por mês' : 'Por mes'}
        </button>
      </div>

      {modo === 'dia' && (<>
        <div className="flex items-center gap-2 bg-surface rounded-2xl shadow-card p-3">
          <button onClick={() => setFecha(d => subDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-offset text-xl font-bold">‹</button>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-t1 capitalize">
              {format(new Date(fecha+'T12:00:00'), "EEEE d 'de' MMMM", { locale: dateLocale })}
            </span>
            {esHoy && <Badge label={t.hoy} variant="success" />}
          </div>
          <button onClick={() => setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
            disabled={esHoy}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-t2 hover:bg-offset text-xl font-bold disabled:opacity-30">›</button>
        </div>

        {loadingDia ? <Spinner /> : (<>
          {ingresosActivos.length === 0 && egresos.length === 0
            ? <EmptyState message={t.sin_movimientos} />
            : (<>
                {turnosConDatos.map(turno => {
                  const ingT = getIngTurno(turno);
                  const egrT = getEgrTurno(turno);
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
                    <Card key={turno}>
                      <CardHeader title={turnoLabel[turno]} subtitle={`${ingT.length} ${t.wa_ventas} · ${fmtL(ventasBrutas)}`} />
                      <div className="p-4 flex flex-col gap-4">
                        {Object.keys(porMedio).length > 0 && (
                          <div>
                            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-2">{t.por_medio_pago}</div>
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
                            <div className="text-[11px] font-medium text-t3 uppercase tracking-wide mb-2">{t.gastos}</div>
                            {(() => {
                              const totalEgr = egrT.reduce((s, e) => s + e.monto, 0);
                              const porTipo = {};
                              egrT.forEach(e => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + e.monto; });
                              return Object.entries(porTipo).map(([tipo, montoTipo]) => {
                                const tp = TIPOS_EGRESO.find(te => te.key === tipo);
                                const pct = totalEgr > 0 ? ((montoTipo / totalEgr) * 100).toFixed(0) : 0;
                                return (
                                  <div key={tipo} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-sm text-t2">{tp?.label || tipo}</span>
                                      <div className="flex gap-1 flex-wrap">
                                        {egrT.filter(e => e.tipo === tipo).map(e => (
                                          <span key={e.id} className="text-[10px] text-t3 bg-offset px-1.5 py-0.5 rounded-full">
                                            {e.medio_pago === 'transferencia' ? (isPT ? 'Transf.' : 'Transf.') : (isPT ? 'Dinheiro' : 'Efectivo')}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-t3">{pct}%</span>
                                      <span className="text-sm font-semibold text-ambertext tabular-nums">−{fmtL(montoTipo)}</span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                        <div className="bg-offset rounded-xl p-3">
                          <DivRow label={t.ventas_brutas} value={fmtL(ventasBrutas)} />
                          {retenciones > 0 && <DivRow label={t.retenciones} value={fmtL(retenciones)} valueClass="text-t3" />}
                          <DivRow label={t.ventas_netas} value={fmtL(ventasNetas)} valueClass="text-greentext" />
                          {gastosTurno > 0 && <DivRow label={t.gastos} value={`−${fmtL(gastosTurno)}`} valueClass="text-ambertext" />}
                          <DivRow label={t.resultado}
                            value={`${resultTurno >= 0 ? '' : '−'}${fmtL(Math.abs(resultTurno))}`}
                            valueClass={resultTurno >= 0 ? 'text-greentext' : 'text-redtext'} bold />
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {ingresosAnulados.length > 0 && (
                  <Card>
                    <CardHeader title={t.anulaciones} subtitle={`${ingresosAnulados.length} registros`} />
                    <div className="p-4 flex flex-col gap-2">
                      {ingresosAnulados.map(i => {
                        const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                        return (
                          <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-redsoft border border-red/10">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-t2 line-through">{m?.label} · {fmtL(i.monto_bruto)}</div>
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
                    <CardHeader title={isPT ? 'Total do dia' : 'Total del día'} />
                    <div className="p-4">
                      <DivRow label={t.ventas_brutas} value={fmtL(resDia.totalBruto)} />
                      {resDia.totalRetencion > 0 && <DivRow label={t.retenciones} value={fmtL(resDia.totalRetencion)} valueClass="text-t3" />}
                      <DivRow label={t.ventas_netas} value={fmtL(resDia.totalNeto)} valueClass="text-greentext" />
                      {resDia.totalEgresos > 0 && <DivRow label={t.gastos} value={`−${fmtL(resDia.totalEgresos)}`} valueClass="text-ambertext" />}
                      <DivRow label={t.resultado}
                        value={`${resDia.resultado >= 0 ? '' : '−'}${fmtL(Math.abs(resDia.resultado))}`}
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
                {isPT ? 'Rentabilidade' : 'Rentabilidad'}: <span className="text-greentext font-semibold">
                  {((resMes.resultado / resMes.totalBruto) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <KpiCard label={t.ventas_brutas} value={resMes.totalBruto} color="green" fmtFn={fmtL} />
            <KpiCard label={t.retenciones} value={resMes.totalRetencion} color="red" fmtFn={fmtL} />
          </div>
          <div className="flex gap-3">
            <KpiCard label={t.ventas_netas} value={resMes.totalNeto} fmtFn={fmtL} />
            <KpiCard label={t.gastos} value={resMes.totalEgresos} color="amber" fmtFn={fmtL} />
          </div>
          <ResultadoCard valor={resMes.resultado} label={isPT ? 'Resultado do mês' : 'Resultado del mes'} />
          {retRowsMes.length > 0 && (
            <Card>
              <CardHeader title={t.por_medio_pago} />
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
