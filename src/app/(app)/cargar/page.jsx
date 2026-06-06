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
  getTurnosCerradosHoy, getCierreDiario, getTurnoAbierto
} from '../../../lib/data';
import { getClient } from '../../../lib/supabase';
import { MEDIOS_PAGO, TURNOS } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  BtnPrimary, BtnSecondary, Toast, useToast, Spinner,
  FieldLabel, DivRow
} from '../../../components/ui';

const STORAGE_KEY = 'troco_lista_turno';
const CAJA_KEY = 'troco_caja_abierta';

export default function CargarPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const online = useOnline();
  const { toast, visible, show } = useToast();

  const [config,          setConfig]          = useState(null);
  const [turno,           setTurno]           = useState(null);
  const [turnosCerrados,  setTurnosCerrados]  = useState([]);
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
  const [fechaTurno,      setFechaTurno]      = useState(todayStr());

  useEffect(() => {
    if (!usuario) return;

    try {
      const fechaGuardada = localStorage.getItem(CAJA_KEY);
      if (fechaGuardada && !fechaGuardada.startsWith(todayStr())) {
        localStorage.removeItem(CAJA_KEY);
      }
    } catch {}

    getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLista(JSON.parse(saved));
    } catch {}

    setColaPendiente(getCola());

    getTurnosCerradosHoy(usuario.bar_id).then(cerrados => {
      setTurnosCerrados(cerrados);
      if (cerrados.includes('1') && cerrados.includes('2')) {
        setTurno('sin_turno');
        getTurnoAbierto(usuario.bar_id, todayStr(), 'sin_turno').then(turnoExistente => {
          if (turnoExistente) {
            setAperturaLista(true);
            try { localStorage.setItem(CAJA_KEY, todayStr() + '_sin_turno'); } catch {}
          } else {
            if (usuario?.rol !== 'admin') setMostrarApertura(true);
          }
        }).catch(() => {
          if (usuario?.rol !== 'admin') setMostrarApertura(true);
        });
      } else if (cerrados.includes('1')) {
        setTurno('2');
        getTurnoAbierto(usuario.bar_id, todayStr(), '2').then(turnoExistente => {
          if (turnoExistente) {
            setAperturaLista(true);
            try { localStorage.setItem(CAJA_KEY, todayStr() + '_2'); } catch {}
          } else {
            if (usuario?.rol !== 'admin') setMostrarApertura(true);
          }
        }).catch(() => {
          if (usuario?.rol !== 'admin') setMostrarApertura(true);
        });
      } else {
        setTurno('1');
        getTurnoAbierto(usuario.bar_id, todayStr(), '1').then(turnoExistente => {
          if (turnoExistente) {
            setAperturaLista(true);
            try { localStorage.setItem(CAJA_KEY, todayStr() + '_1'); } catch {}
          } else {
            if (usuario?.rol !== 'admin') setMostrarApertura(true);
          }
        }).catch(() => {
          if (usuario?.rol !== 'admin') setMostrarApertura(true);
        });
      }
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

  async function confirmarAnulacion() {
    if (!motivoAnulacion.trim()) return show('⚠ Ingresá un motivo');
    try {
      const sb = getClient();
      if (anulando.supabase_id) {
        await sb.from('ingresos').update({ anulada: true, motivo_anulacion: motivoAnulacion }).eq('id', anulando.supabase_id);
      } else {
        await sb.from('ingresos').insert([{
          bar_id: usuario.bar_id, turno_id: null, usuario_id: usuario.id,
          medio_pago: anulando.medio_pago, monto_bruto: anulando.monto_bruto,
          retencion_pct: anulando.retencion_pct, retencion_monto: anulando.retencion_monto,
          monto_neto: anulando.monto_neto, nota: anulando.nota || '',
          fecha: new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(),
          anulada: true, motivo_anulacion: motivoAnulacion,
        }]);
      }
      setLista(l => l.map(i => i._id === anulando._id ? { ...i, anulada: true, motivo_anulacion: motivoAnulacion } : i));
      setAnulando(null);
      show('✓ Venta anulada');
    } catch { show('✗ Error al registrar anulación'); }
  }

  async function cerrarTurnoHandler() {
    if (activas.length === 0) return show('⚠ No hay ventas para cerrar');
    setCerrando(true);

    if (!online) {
      const rows = activas.filter(i => !i.supabase_id).map(item => ({
        bar_id: usuario.bar_id, turno_id: null, usuario_id: usuario.id,
        medio_pago: item.medio_pago, monto_bruto: item.monto_bruto,
        retencion_pct: item.retencion_pct, retencion_monto: item.retencion_monto,
        monto_neto: item.monto_neto, nota: item.nota || '',
        fecha: new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(),
        anulada: false, motivo_anulacion: '',
      }));
      agregarACola({
        bar_id: usuario.bar_id, usuario_id: usuario.id,
        fecha: fechaTurno, turno, caja_inicial: parseFloat(cajaInicial) || 0, rows,
      });
      setColaPendiente(getCola());
      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      if (turno === '1') setTurno('2');
      else if (turno === '2') setTurno('sin_turno');
      show(`📴 Sin conexión · Turno guardado localmente`);
      setCerrando(false);
      setTimeout(() => router.push('/resumen'), 2000);
      return;
    }

    try {
      await cerrarTurnoConPendientes({
        barId: usuario.bar_id,
        usuarioId: usuario.id,
        fecha: fechaTurno,
        turno,
        cajaInicial: parseFloat(cajaInicial) || 0,
      });

      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      setTurnosCerrados(prev => [...prev, turno]);
      if (turno === '1') { setTurno('2'); setAperturaLista(false); setMostrarApertura(true); }
      else if (turno === '2') setTurno('sin_turno');

      if (config?.wa_cierre_turno && config?.whatsapp_numero) {
        const turnoLabel = turno === '1' ? 'Turno 1' : turno === '2' ? 'Turno 2' : 'Turno único';
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
          <div className="text-sm text-t3">El administrador cerró el día de hoy.</div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {!online && (
        <div className="bg-ambersoft border border-amber/20 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-xl">📴</span>
          <div>
            <div className="text-sm font-semibold text-ambertext">Sin conexión</div>
            <div className="text-xs text-t3">Podés seguir cargando — se sincroniza al reconectar</div>
          </div>
        </div>
      )}

      {sincronizando && (
        <div className="bg-greensoft border border-primary/20 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-xl">🔄</span>
          <div className="text-sm font-semibold text-greentext">Sincronizando datos...</div>
        </div>
      )}

      {colaPendiente.length > 0 && online && !sincronizando && (
        <div className="bg-ambersoft border border-amber/20 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ambertext">Datos pendientes</div>
            <div className="text-xs text-t3">{colaPendiente.length} turno(s) sin sincronizar</div>
          </div>
          <button onClick={sincronizarCola}
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold">
            Sincronizar
          </button>
        </div>
      )}

      {mostrarApertura && !aperturaLista && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-xl">
            <div className="text-center">
              <div className="text-3xl mb-2">{turno === '2' ? '🌙' : '🏪'}</div>
              <div className="text-lg font-bold text-t1">
                {turno === '1' ? 'Apertura de caja' : turno === '2' ? 'Recepción de caja' : 'Apertura de caja'}
              </div>
              <div className="text-sm text-t3 mt-1 capitalize">
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {turno === '1' ? 'Turno 1 ☀️' : turno === '2' ? 'Turno 2 🌙' : 'Turno único ⭐'}
              </div>
            </div>
            <div>
              <FieldLabel>{turno === '2' ? 'Monto recibido del turno anterior' : 'Monto de apertura de caja'}</FieldLabel>
              <div className="flex items-center bg-offset rounded-xl px-4 border border-transparent focus-within:border-primary/40 transition">
                <span className="text-2xl font-light text-t3 mr-1">$</span>
                <input type="number" inputMode="decimal" value={cajaInicial}
                  onChange={e => setCajaInicial(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent py-4 text-3xl font-bold tracking-tight placeholder:text-t4 focus:outline-none tabular-nums text-t1"
                  autoFocus />
              </div>
            </div>
            <BtnPrimary label={turno === '2' ? 'Recibir caja' : 'Abrir caja'} onClick={async () => {
              const fechaApertura = todayStr();
              setFechaTurno(fechaApertura);
              setMostrarApertura(false);
              setAperturaLista(true);
              if (!cajaInicial) setCajaInicial('0');
              try { localStorage.setItem(CAJA_KEY, fechaApertura + '_' + turno); } catch {}
              if (online) {
                try {
                  await abrirTurno(usuario.bar_id, usuario.id, fechaApertura, turno, parseFloat(cajaInicial) || 0);
                } catch {}
              }
            }} />
          </div>
        </div>
      )}

      {anulando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-5 flex flex-col gap-4 shadow-xl">
            <div>
              <div className="text-base font-bold text-t1">Anular venta</div>
              <div className="text-sm text-t3 mt-1">{anulando.medio_label} · {fmt(anulando.monto_bruto)}</div>
            </div>
            <div>
              <FieldLabel>Motivo de anulación</FieldLabel>
              <textarea value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.t
