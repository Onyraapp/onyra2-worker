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
  getCajaInicialDia, getTurnosCerradosHoy, fmt, todayStr
} from '../../../lib/data';
import { getClient } from '../../../lib/supabase';
import { MEDIOS_PAGO, TIPOS_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, KpiCard,
  BreakdownBar, EmptyState, Spinner,
  BtnPrimary, Badge, DivRow, Toast, useToast
} from '../../../components/ui';

const VENC_ALERTA_KEY = 'troco_venc_alerta';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const { toast, visible, show } = useToast();
  const [fecha,         setFecha]         = useState(todayStr());
  const [ingresos,      setIngresos]      = useState([]);
  const [egresos,       setEgresos]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [diaCerrado,    setDiaCerrado]    = useState(false);
  const [cerrandoDia,   setCerrandoDia]   = useState(false);
  const [cajaInicial,   setCajaInicial]   = useState(0);
  const [turnoActivo,   setTurnoActivo]   = useState('');
  const [modalCierre,   setModalCierre]   = useState(false);
  const [resumenCierre, setResumenCierre] = useState(null);

  const esHoy = fecha === todayStr();
  const isAdmin = usuario?.rol === 'admin';

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
        const lineas = vencs.map(v => `⚠ ${v.detalle}: ${fmt(v.importe)}`).join('\n');
        const msg = `*Troco - Vencimientos de hoy*\n\n${lineas}`;
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
      setCajaInicial(caja);
      if (esHoy) {
        const cerrados = await getTurnosCerradosHoy(usuario.bar_id);
        if (cerrados.includes('1') && cerrados.includes('2')) setTurnoActivo('— Sin turno');
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

 const res = calcularResumenDia(ingresosActivos, egresos);
  const fechaDisplay = format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es });
  const ingresosActivos  = ingresos.filter(i => !i.anulada);
  const ingresosAnulados = ingresos.filter(i => i.anulada);
  const egresosFiltrados = isAdmin ? egresos : egresos.filter(e => e.tipo !== 'retiros');
  const resFiltrado = calcularResumenDia(ingresos, egresosFiltrados);

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
    try {
      const fechaCierre = fecha;
      const [ing, egr, cfg, caja] = await Promise.all([
        getIngresosDia(usuario.bar_id, fechaCierre),
        getEgresosDia(usuario.bar_id, fechaCierre),
        getConfiguracion(usuario.bar_id),
        getCajaInicialDia(usuario.bar_id, fechaCierre),
      ]);
      const r = calcularResumenDia(ing, egr);
      const fechaLabel = format(new Date(fechaCierre + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es });
      const sb = getClient();
      const manana = addDays(new Date(fechaCierre + 'T12:00:00'), 1).toISOString().slice(0, 10);
      const { data: vencsManana } = await sb
        .from('vencimientos')
        .select('*')
        .eq('bar_id', usuario.bar_id)
        .eq('fecha', manana);
      const lineasVenc = vencsManana && vencsManana.length > 0
        ? '\n\n*⚠ Vencimientos mañana:*\n' + vencsManana.map(v => `• ${v.detalle}: ${fmt(v.importe)}`).join('\n')
        : '';
      const msg = [
        `*Troco - Cierre del ${fechaLabel}*`, ``,
        `Caja inicial:   ${fmt(caja)}`,
        `Ventas brutas:  ${fmt(r.totalBruto)}`,
        `Retenciones:    -${fmt(r.totalRetencion)}`,
        `Ventas netas:   ${fmt(r.totalNeto)}`,
        `Gastos:         -${fmt(r.totalEgresos)}`, ``,
        `Resultado: *${r.resultado >= 0 ? '' : '-'}${fmt(Math.abs(r.resultado))}*`, ``,
        `_${ing.filter(i => !i.anulada).length} ventas - ${ing.filter(i => i.anulada).length} anulaciones_`,
      ].join('\n') + lineasVenc;
      const numero = cfg?.whatsapp_numero?.trim();
      const url = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      setResumenCierre({ r, caja, ing, fechaLabel, url, fechaCierre });
      setModalCierre(true);
    } catch { show('✗ Error al generar el cierre'); }
    finally { setCerrandoDia(false); }
  }

  async function confirmarCierre() {
    try {
      await crearCierreDiario(usuario.bar_id, usuario.id, resumenCierre.fechaCierre);
      setDiaCerrado(true);
      setModalCierre(false);
      show('✓ Día cerrado');
      if (isAdmin) setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10));
    } catch (e) {
      if (e?.code === '23505') {
        setDiaCerrado(true);
        setModalCierre(false);
        if (isAdmin) setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10));
      } else {
        show('✗ Error al confirmar el cierre');
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
              <div className="text-lg font-bold text-t1">Cierre del día</div>
              <div className="text-sm text-t3 mt-1 capitalize">{resumenCierre.fechaLabel}</div>
            </div>
            <div className="bg-offset rounded-2xl p-4">
              <DivRow label="Caja inicial"  value={fmt(resumenCierre.caja)} />
              <DivRow label="Ventas brutas" value={fmt(resumenCierre.r.totalBruto)} />
              <DivRow label="Retenciones"   value={`-${fmt(resumenCierre.r.totalRetencion)}`} valueClass="text-redtext" />
              <DivRow label="Ventas netas"  value={fmt(resumenCierre.r.totalNeto)} valueClass="text-greentext" />
              <DivRow label="Gastos"        value={`-${fmt(resumenCierre.r.totalEgresos)}`} valueClass="text-ambertext" />
              <DivRow label="Resultado"
                value={`${resumenCierre.r.resultado >= 0 ? '' : '-'}${fmt(Math.abs(resumenCierre.r.resultado))}`}
                valueClass={resumenCierre.r.resultado >= 0 ? 'text-greentext' : 'text-redtext'} bold />
            </div>
            <div className="text-center text-xs text-t3">
              {resumenCierre.ing.filter(i => !i.anulada).length} ventas · {resumenCierre.ing.filter(i => i.anulada).length} anulaciones
            </div>
            
              <BtnPrimary
              label="Confirmar y enviar por WhatsApp"
              onClick={() => { window.open(resumenCierre.url, '_blank'); confirmarCierre(); }}
            />
            <button onClick={() => setModalCierre(false)} className="w-full h-10 text-t3 text-sm">
              Cancelar
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
            {esHoy && <Badge label="Hoy" variant="success" />}
            {esHoy && turnoActivo && <Badge label={turnoActivo} variant="primary" />}
            {diaCerrado && <Badge label="Cerrado" variant="danger" />}
          </div>
        </div>
        <button onClick={() => setFecha(d => addDays(new Date(d+'T12:00:00'),1).toISOString().slice(0,10))}
          disabled={esHoy || !isAdmin}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white hover:bg-white/10 text-xl font-bold disabled:opacity-30">›</button>
      </div>

      {loading ? <Spinner /> : (<>
        <div className="flex gap-3">
          <KpiCard label="Caja inicial"  value={cajaInicial} />
          <KpiCard label="Ventas brutas" value={resFiltrado.totalBruto} color="green" />
        </div>
        <div className="flex gap-3">
          <KpiCard label="Gastos"  value={resFiltrado.totalEgresos} color="amber" />
          <KpiCard label="Saldo"   value={resFiltrado.resultado} color={resFiltrado.resultado >= 0 ? 'green' : 'red'} />
        </div>

        {retRows.length > 0 && (
          <Card>
            <CardHeader title="Por medio de pago" subtitle="Ventas brutas por canal" />
            <div className="p-4 flex flex-col divide-y divide-divider">
              {retRows.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-sm text-t1">{r.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-t1 tabular-nums">{fmt(r.bruto)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {egresos.length > 0 && (
          <Card>
            <CardHeader title="Gastos del día" subtitle={`${egresos.length} movimientos · ${fmt(res.totalEgresos)}`} />
            <div className="p-4 flex flex-col gap-3">
              {TIPOS_EGRESO.filter(t => egresosPorTipo[t.key]).map(t => (
                <BreakdownBar key={t.key} label={t.label} value={egresosPorTipo[t.key]} total={res.totalEgresos} color="#FF9500" />
              ))}
            </div>
          </Card>
        )}

        {isAdmin && ingresosAnulados.length > 0 && (
          <Card>
            <CardHeader title="Anulaciones del día" subtitle={`${ingresosAnulados.length} registros`} />
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
          <CardHeader title="Movimientos" subtitle={`${ingresosActivos.length + egresos.length} registros`} />
          <div className="p-4 flex flex-col gap-2">
            {ingresosActivos.length === 0 && egresos.length === 0
              ? <EmptyState message="Sin movimientos este día" />
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
                          <div className="text-sm font-bold tabular-nums text-greentext">{fmt(i.monto_bruto)}</div>
                          {i.retencion_monto > 0 && <div className="text-xs text-redtext tabular-nums">−{fmt(i.retencion_monto)}</div>}
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
                        <div className="text-sm font-bold tabular-nums text-ambertext flex-shrink-0">−{fmt(e.monto)}</div>
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
          <button onClick={abrirCierreDiario} disabled={cerrandoDia || diaCerrado}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40
              ${diaCerrado ? 'bg-offset text-t3 border border-divider' : 'bg-primary text-white'}`}>
            {cerrandoDia ? '...' : diaCerrado ? '✓ Cerrado' : '📲 Cierre diario'}
          </button>
        </div>
      </>)}
    </Screen>
  );
}
