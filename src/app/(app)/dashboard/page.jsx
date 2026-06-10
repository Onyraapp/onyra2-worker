// src/app/(app)/dashboard/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import {
  getIngresosDia, getEgresosDia, calcularResumenDia,
  getConfiguracion, getCierreDiario, crearCierreDiario,
  getCajaInicialDia, getTurnosCerradosHoy, fmt, todayStr
} from '../../../lib/data';
import { getClient } from '../../../lib/supabase';
import { MEDIOS_PAGO, TIPOS_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, KpiCard,
  BreakdownBar, EmptyState, Spinner,
  BtnPrimary, Badge, DivRow, Toast, useToast
} from '../../../components/ui';
import { useLocale } from '../../../hooks/useLocale';

const VENC_ALERTA_KEY = 'troco_venc_alerta';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const { toast, visible, show } = useToast();
  const { t, isPT, fmt: fmtL } = useLocale();

  const [fecha,           setFecha]           = useState(todayStr());
  const [ingresos,        setIngresos]        = useState([]);
  const [egresos,         setEgresos]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [diaCerrado,      setDiaCerrado]      = useState(false);
  const [reaperturaCausa, setReoaerturaCausa] = useState(null);
  const [cerrandoDia,     setCerrandoDia]     = useState(false);
  const [cajaInicial,     setCajaInicial]     = useState(0);
  const [turnoActivo,     setTurnoActivo]     = useState('');
  const [modalCierre,     setModalCierre]     = useState(false);
  const [resumenCierre,   setResumenCierre]   = useState(null);
  const [cierreListo,     setCierreListo]     = useState(false);

  const esHoy = fecha === todayStr();
  const isAdmin = usuario?.rol === 'admin';
  const dateLocale = isPT ? ptBR : es;

  useEffect(() => {
    if (!usuario || !isAdmin) return;
    async function checkVencimientosHoy() {
      try {
        const yaEnviado = localStorage.getItem(VENC_ALERTA_KEY) === todayStr();
        if (yaEnviado) return;
        const sb = getClient();
        const hoy = todayStr();
        const { data: vencs } = await sb
          .from('vencimientos')
          .select('*')
          .eq('bar_id', usuario.bar_id)
          .eq('fecha', hoy);
        if (!vencs || vencs.length === 0) return;
        const cfg = await getConfiguracion(usuario.bar_id);
        if (!cfg?.whatsapp_numero) return;
        const lineas = vencs.map(v => `⚠ ${v.detalle}: ${fmtL(v.importe)}`).join('\n');
        const msg = `*Troco - ${t.vencimientos}*\n\n${lineas}`;
        window.open(`https://wa.me/${cfg.whatsapp_numero}?text=${encodeURIComponent(msg)}`, '_blank');
        localStorage.setItem(VENC_ALERTA_KEY, hoy);
      } catch {}
    }
    checkVencimientosHoy();
  }, [usuario]);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const [ing, egr, cierre, caja] = await Promise.all([
        getIngresosDia(usuario.bar_id, fecha),
        getEgresosDia(usuario.bar_id, fecha),
        getCierreDiario(usuario.bar_id, fecha),
        getCajaInicialDia(usuario.bar_id, fecha),
      ]);
      setIngresos(ing); setEgresos(egr);
      setDiaCerrado(!!cierre);
      setReoaerturaCausa(cierre?.reapertura_causa || null);
      setCajaInicial(caja);
      if (esHoy) {
        const cerrados = await getTurnosCerradosHoy(usuario.bar_id);
        if (cerrados.includes('1') && cerrados.includes('2')) setTurnoActivo('— ' + (isPT ? 'Turno único' : 'Sin turno'));
        else if (cerrados.includes('1')) setTurnoActivo('🌙 Turno 2');
        else setTurnoActivo('☀️ Turno 1');
      }
    } finally { setLoading(false); }
  }, [usuario, fecha]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  const ingresosActivos  = ingresos.filter(i => !i.anulada);
  const ingresosAnulados = ingresos.filter(i => i.anulada);
  const egresosFiltrados = isAdmin ? egresos : egresos.filter(e => e.tipo !== 'retiros');
  const res = calcularResumenDia(ingresosActivos, egresos);
  const resFiltrado = calcularResumenDia(ingresosActivos, egresosFiltrados);
  const fechaDisplay = format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: dateLocale });

  const retRows = MEDIOS_PAGO
    .filter(m => res.porMedio[m.key])
    .map(m => ({ label: m.label, color: m.color, bruto: res.porMedio[m.key].bruto }));

  const egresosPorTipo = egresos.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + e.monto;
    return acc;
  }, {});

  async function abrirCierreDiario() {
    if (diaCerrado) return;
    setCerrandoDia(true);
    setCierreListo(false);
    try {
      const fechaCierre = fecha;
      const [ing, egr, cfg, caja] = await Promise.all([
        getIngresosDia(usuario.bar_id, fechaCierre),
        getEgresosDia(usuario.bar_id, fechaCierre),
        getConfiguracion(usuario.bar_id),
        getCajaInicialDia(usuario.bar_id, fechaCierre),
      ]);
      const ingActivos = ing.filter(i => !i.anulada);
      const r = calcularResumenDia(ingActivos, egr);
      const fechaLabel = format(new Date(fechaCierre + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: dateLocale });
      const sb = getClient();
      const manana = addDays(new Date(fechaCierre + 'T12:00:00'), 1).toISOString().slice(0, 10);
      const { data: vencsManana } = await sb
        .from('vencimientos')
        .select('*')
        .eq('bar_id', usuario.bar_id)
        .eq('fecha', manana);
      const lineasVenc = vencsManana && vencsManana.length > 0
        ? `\n\n*${t.wa_venc_manana}:*\n` + vencsManana.map(v => `• ${v.detalle}: ${fmtL(v.importe)}`).join('\n')
        : '';
      const msg = [
        `*${t.wa_cierre} ${fechaLabel}*`, ``,
        `${t.wa_caja_inicial}:   ${fmtL(caja)}`,
        `${t.wa_ventas_brutas}:  ${fmtL(r.totalBruto)}`,
        `${t.wa_retenciones}:    -${fmtL(r.totalRetencion)}`,
        `${t.wa_ventas_netas}:   ${fmtL(r.totalNeto)}`,
        `${t.wa_gastos}:         -${fmtL(r.totalEgresos)}`, ``,
        `${t.resultado}: *${r.resultado >= 0 ? '' : '-'}${fmtL(Math.abs(r.resultado))}*`, ``,
        `_${ingActivos.length} ${t.wa_ventas} - ${ing.filter(i => i.anulada).length} ${t.wa_anulaciones}_`,
      ].join('\n') + lineasVenc;
      const numero = cfg?.whatsapp_numero?.trim();
      const url = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      setResumenCierre({ r, caja, ing, fechaLabel, url, fechaCierre });
      setModalCierre(true);
    } catch { show('✗ ' + t.error); }
    finally { setCerrandoDia(false); }
  }

  async function confirmarCierre() {
    try {
      await crearCierreDiario(usuario.bar_id, usuario.id, resumenCierre.fechaCierre);
      setDiaCerrado(true);
      setCierreListo(true);
      show('✓ ' + t.cierre_titulo);
      setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10));
    } catch (e) {
      if (e?.code === '23505') {
        setDiaCerrado(true);
        setCierreListo(true);
        setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10));
      } else {
        show('✗ ' + t.error);
      }
    }
  }

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {modalCierre && resumenCierre && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl">
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-lg font-bold text-t1">{t.cierre_titulo}</div>
              <div className="text-sm text-t3 mt-1 capitalize">{resumenCierre.fechaLabel}</div>
            </div>
            <div className="bg-offset rounded-2xl p-4">
              <DivRow label={t.caja_inicial}  value={fmtL(resumenCierre.caja)} />
              <DivRow label={t.ventas_brutas} value={fmtL(resumenCierre.r.totalBruto)} />
              <DivRow label={t.retenciones}   value={`-${fmtL(resumenCierre.r.totalRetencion)}`} valueClass="text-redtext" />
              <DivRow label={t.ventas_netas}  value={fmtL(resumenCierre.r.totalNeto)} valueClass="text-greentext" />
              <DivRow label={t.gastos}        value={`-${fmtL(resumenCierre.r.totalEgresos)}`} valueClass="text-ambertext" />
              <DivRow label={t.resultado}
                value={`${resumenCierre.r.resultado >= 0 ? '' : '-'}${fmtL(Math.abs(resumenCierre.r.resultado))}`}
                valueClass={resumenCierre.r.resultado >= 0 ? 'text-greentext' : 'text-redtext'} bold />
            </div>
            <div className="text-center text-xs text-t3">
              {resumenCierre.ing.filter(i => !i.anulada).length} {t.wa_ventas} · {resumenCierre.ing.filter(i => i.anulada).length} {t.wa_anulaciones}
            </div>
            {!cierreListo ? (
              <BtnPrimary
                label={cerrandoDia ? '...' : t.confirmar_cierre}
                onClick={async () => {
                  setCerrandoDia(true);
                  await confirmarCierre();
                  setCerrandoDia(false);
                }}
                loading={cerrandoDia}
              />
            ) : (
              
                href={resumenCierre.url}
                className="w-full h-12 rounded-xl bg-[#25D366] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t.enviar_whatsapp}
              </a>
            )}
            <button onClick={() => { setModalCierre(false); setCierreListo(false); }} className="w-full h-10 text-t3 text-sm">
              {cierreListo ? t.cerrar : t.cancelar}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[#0F4C5C] rounded-2xl shadow-card p-3">
        <button onClick={() => setFecha(d => subDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          disabled={!isAdmin}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white hover:bg-white/10 text-xl font-bold disabled:opacity-30">‹</button>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-white capitalize">{fechaDisplay}</span>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {esHoy && <Badge label={t.hoy} variant="success" />}
            {esHoy && turnoActivo && <Badge label={turnoActivo} variant="primary" />}
            {diaCerrado && <Badge label={isPT ? 'Fechado' : 'Cerrado'} variant="danger" />}
            {reaperturaCausa && <Badge label={`↩ ${reaperturaCausa}`} variant="warning" />}
          </div>
        </div>
        <button onClick={() => setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          disabled={esHoy || !isAdmin}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white hover:bg-white/10 text-xl font-bold disabled:opacity-30">›</button>
      </div>

      {loading ? <Spinner /> : (<>
        <div className="flex gap-3">
          <KpiCard label={t.caja_inicial}  value={cajaInicial} fmt={fmtL} />
          <KpiCard label={t.ventas_brutas} value={resFiltrado.totalBruto} color="green" fmt={fmtL} />
        </div>
        <div className="flex gap-3">
          <KpiCard label={t.gastos}  value={resFiltrado.totalEgresos} color="amber" fmt={fmtL} />
          <KpiCard label={t.saldo}   value={resFiltrado.resultado} color={resFiltrado.resultado >= 0 ? 'green' : 'red'} fmt={fmtL} />
        </div>

        {retRows.length > 0 && (
          <Card>
            <CardHeader title={t.por_medio_pago} subtitle={t.ventas_brutas} />
            <div className="p-4 flex flex-col divide-y divide-divider">
              {retRows.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-sm text-t1">{r.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-t1 tabular-nums">{fmtL(r.bruto)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {egresos.length > 0 && (
          <Card>
            <CardHeader title={t.gastos_del_dia} subtitle={`${egresos.length} · ${fmtL(res.totalEgresos)}`} />
            <div className="p-4 flex flex-col gap-3">
              {TIPOS_EGRESO.filter(t => egresosPorTipo[t.key]).map(t => (
                <BreakdownBar key={t.key} label={t.label} value={egresosPorTipo[t.key]} total={res.totalEgresos} color="#FF9500" />
              ))}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title={t.movimientos} subtitle={`${ingresosActivos.length + egresos.length} registros`} />
          <div className="p-4 flex flex-col gap-2">
            {ingresosActivos.length === 0 && egresos.length === 0
              ? <EmptyState message={t.sin_movimientos} />
              : (<>
                  {ingresosActivos.map(i => {
                    const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                    return (
                      <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                        <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: m?.color || '#2D6B8C' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-t1">{m?.label}</div>
                          <div className="text-xs text-t3 mt-0.5">
                            {i.fecha?.slice(11,16)}
                            {i.retencion_pct > 0 && ` · ${i.retencion_pct}% ret.`}
                          </div>
                          {i.nota && <div className="text-xs text-t2 mt-0.5 italic truncate">{i.nota}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold tabular-nums text-greentext">{fmtL(i.monto_bruto)}</div>
                          {i.retencion_monto > 0 && <div className="text-xs text-redtext tabular-nums">−{fmtL(i.retencion_monto)}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {egresos.map(e => {
                    const tp = TIPOS_EGRESO.find(te => te.key === e.tipo);
                    return (
                      <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                        <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0 bg-amber" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-t1">{tp?.label || e.tipo}</div>
                          <div className="text-xs text-t3 mt-0.5">{e.fecha?.slice(11,16)}</div>
                          {e.detalle && <div className="text-xs text-t2 mt-0.5 italic truncate">{e.detalle}</div>}
                        </div>
                        <div className="text-sm font-bold tabular-nums text-ambertext flex-shrink-0">−{fmtL(e.monto)}</div>
                      </div>
                    );
                  })}
                </>)
            }
          </div>
        </Card>

        {isAdmin && ingresosAnulados.length > 0 && (
          <Card>
            <CardHeader title={t.anulaciones} subtitle={`${ingresosAnulados.length} registros`} />
            <div className="p-4 flex flex-col gap-2">
              {ingresosAnulados.map(i => {
                const m = MEDIOS_PAGO.find(mp => mp.key === i.medio_pago);
                return (
                  <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-redsoft border border-red/10">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-t2 line-through">{m?.label} · {fmtL(i.monto_bruto)}</div>
                      <div className="text-xs text-t3 mt-0.5">{i.fecha?.slice(11,16)} · {i.motivo_anulacion}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <BtnPrimary label={t.cargar_venta} onClick={() => router.push('/cargar')} />
        <div className="flex gap-2">
          <button onClick={() => router.push('/egresos')}
            className="flex-1 h-11 rounded-xl bg-surface shadow-card border border-border text-t1 text-sm font-medium">
            {t.registrar_gasto}
          </button>
          <button onClick={abrirCierreDiario} disabled={cerrandoDia || diaCerrado}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40
              ${diaCerrado ? 'bg-offset text-t3 border border-divider' : 'bg-primary text-white'}`}>
            {cerrandoDia ? '...' : diaCerrado ? t.dia_cerrado : t.cierre_diario}
          </button>
        </div>
      </>)}
    </Screen>
  );
}
