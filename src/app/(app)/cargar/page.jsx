// src/app/(app)/cargar/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useOnline, agregarACola, getCola, limpiarCola } from '../../../hooks/useOnline';
import {
  getConfiguracion, calcularRetencion, getRetencionPct,
  abrirTurno, cerrarTurno, crearIngresosBulk, crearIngresoInstant,
  cerrarTurnoConPendientes, fmt, todayStr,
  getTurnosCerradosHoy, getCierreDiario
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
  const [agregando,       setAgregando]       = useState(false);

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

  async function agregarAVentas() {
    if (!montoBruto || montoBruto <= 0) return show('⚠ Ingresá un monto válido');
    const m    = MEDIOS_PAGO.find(mp => mp.key === medio);
    const calc = calcularRetencion(montoBruto, pct);
    const item = { ...calc, medio_pago: medio, medio_label: m?.label, medio_color: m?.color, nota, anulada: false, _id: Date.now() };

    if (online) {
      setAgregando(true);
      try {
        const saved = await crearIngresoInstant({
          barId: usuario.bar_id,
          usuarioId: usuario.id,
          medioPago: medio,
          montoBruto: calc.monto_bruto,
          retencionPct: calc.retencion_pct,
          retencionMonto: calc.retencion_monto,
          montoNeto: calc.monto_neto,
          nota,
        });
        setLista(l => [...l, { ...item, supabase_id: saved.id }]);
        show('✓ Venta guardada');
      } catch {
        setLista(l => [...l, item]);
        show('⚠ Guardado localmente');
      } finally {
        setAgregando(false);
      }
    } else {
      setLista(l => [...l, item]);
    }
    setMonto(''); setNota('');
  }

  function pedirAnulacion(item) { setAnulando(item); setMotivoAnulacion(''); }
