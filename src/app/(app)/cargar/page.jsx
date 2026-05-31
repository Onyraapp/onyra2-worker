// src/app/(app)/cargar/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useOnline, agregarACola, getCola, limpiarCola } from '../../../hooks/useOnline';
import {
  getConfiguracion, calcularRetencion, getRetencionPct,
  abrirTurno, cerrarTurno, crearIngresosBulk, fmt, todayStr,
  getIngresosDia, getEgresosDia, calcularResumenDia,
  getTurnosCerradosHoy, getCierreDiario, crearCierreDiario
} from '../../../lib/data';
import { getClient } from '../../../lib/supabase';
import { MEDIOS_PAGO, TURNOS } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  BtnPrimary, BtnSecondary, Toast, useToast, Spinner,
  FieldLabel, DivRow
} from '../../../components/ui';

const STORAGE_KEY = 'troco_lista_turno';

export default function CargarPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const online = useOnline();
  const { toast, visible, show } = useToast();

  const [config,          setConfig]          = useState(null);
  const [turno,           setTurno]           = useState(null);
  const [medio,           setMedio]           = useState('efectivo');
  const [monto,           setMonto]           = useState('');
  const [nota,            setNota]            = useState('');
  const [lista,           setLista]           = useState([]);
  const [cerrando,        setCerrando]        = useState(false);
  const [diaCerrado,      setDiaCerrado]      = useState(false);
  const [cajaInicial,     setCajaInicial]     = useState('');
  const [mostrarApertura, setMostrarApertura] = useState(false);
  const [aperturaLista,   setAperturaLista]   = useState(false);
  const [sincronizando,   setSincronizando]   = useState(false);
  const [colaPendiente,   setColaPendiente]   = useState([]);
  const [anulando,        setAnulando]        = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  useEffect(() => {
    if (!usuario) return;
    getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLista(JSON.parse(saved));
    } catch {}
    setColaPendiente(getCola());
    getTurnosCerradosHoy(usuario.bar_id).then(cerrados => {
      if (cerrados.includes('1') && cerrados.includes('2')) setTurno('sin_turno');
      else if (cerrados.includes('1')) setTurno('2');
      else { setTurno('1'); setMostrarApertura(true); }
    }).catch(() => { setTurno('1'); setMostrarApertura(true); });
    getCierreDiario(usuario.bar_id, todayStr()).then(cierre => {
      if (cierre) setDiaCerrado(true);
    }).catch(() => {});
  }, [usuario]);

  useEffect(() => {
    if (online && colaPendiente.length > 0) sincronizarCola();
  }, [online]);

  async function sincronizarCola() {
    setSincronizando(true);
    try {
      const cola = getCola();
      if (cola.length === 0) { setSincronizando(false); return; }
      for (const item of cola) {
        const t = await abrirTurno(item.bar_id, item.usuario_id, item.fecha, item.turno, item.caja_inicial || 0);
        await crearIngresosBulk(item.rows.map(r => ({ ...r, turno_id: t.id })));
        await cerrarTurno(t.id);
      }
      limpiarCola();
      setColaPendiente([]);
      show('✓ Datos sincronizados con el servidor');
    } catch {
      show('✗ Error al sincronizar — reintentando más tarde');
    } finally {
      setSincronizando(false);
    }
  }

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

  const esCajero = usuario?.rol === 'cajero';
  const bloqueado = esCajero && diaCerrado;

  function agregarAVentas() {
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
        fecha: new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(),
        anulada: true, motivo_anulacion: motivoAnulacion,
      }]);
      setLista(l => l.map(i => i._id === anulando._id ? { ...i, anulada: true, motivo_anulacion: motivoAnulacion } : i));
      setAnulando(null);
      show('✓ Venta anulada y registrada');
    } catch { show('✗ Error al registrar anulación'); }
  }

  async function cerrarTurnoHandler() {
    if (activas.length === 0) return show('⚠ No hay ventas para cerrar');
    setCerrando(true);

    const rows = activas.map(item => ({
      bar_id: usuario.bar_id, turno_id: null, usuario_id: usuario.id,
      medio_pago: item.medio_pago, monto_bruto: item.monto_bruto,
      retencion_pct: item.retencion_pct, retencion_monto: item.retencion_monto,
      monto_neto: item.monto_neto, nota: item.nota || '',
      fecha: new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(),
      anulada: false, motivo_anulacion: '',
    }));

    if (!online) {
      agregarACola({
        bar_id: usuario.bar_id, usuario_id: usuario.id,
        fecha: todayStr(), turno, caja_inicial: parseFloat(cajaInicial) || 0, rows,
      });
      setColaPendiente(getCola());
      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      if (turno === '1') setTurno('2');
      else if (turno === '2') setTurno('sin_turno');
      show(`📴 Sin conexión · Turno guardado localmente · Se sincronizará al reconectar`);
      setCerrando(false);
      setTimeout(() => router.push('/resumen'), 2000);
      return;
    }

    try {
      const t = await abrirTurno(usuario.bar_id, usuario.id, todayStr(), turno, parseFloat(cajaInicial) || 0);
      await crearIngresosBulk(rows.map(r => ({ ...r, turno_id: t.id })));
      await cerrarTurno(t.id);
      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      if (turno === '1') { setTurno('2'); setAperturaLista(false); }
      else if (turno === '2') setTurno('sin_turno');

      if (config?.wa_cierre_turno && config?.whatsapp_numero) {
        const turnoLabel = turno === '1' ? 'Turno 1' : turno === '2' ? 'Turno 2' : 'Sin turno';
        const msg = [
          `*Troco - Cierre de ${turnoLabel}*`, ``,
          `Ventas brutas:  ${fmt(totalBruto)}`,
          `Retenciones:    -${fmt(totalRetencion)}`,
          `Ventas netas:   ${fmt(totalNeto)}`, ``,
          `_${activas.length} ventas_`,
        ].join('\n');
        window.open(`https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      show(`✓ Turno cerrado · ${activas.length} ventas · ${fmt(totalBruto)} bruto`);
      setTimeout(() => router.push('/resumen'), 1500);
    } catch { show('✗ Error al cerrar turno'); }
    finally { setCerrando(false); }
  }

  if (!config || turno === null) return <Spinner />;

  if (bloqueado) {
    return (
      <Screen>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <span className="text-5xl">🔒</span>
          <div className="text-lg font-bold text-t1">Día cerrado</div>
