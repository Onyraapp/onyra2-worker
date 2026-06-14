// src/app/(app)/cargar/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useOnline, agregarACola, getCola, limpiarCola } from '../../../hooks/useOnline';
import {
  getConfiguracion, calcularRetencion, getRetencionPct,
  abrirTurno, cerrarTurno, crearIngresosBulk, crearIngresoInstant,
  cerrarTurnoConPendientes, fmt, todayStr, reabrirDia,
  getTurnosCerradosHoy, getCierreDiario, getTurnoAbierto, getIngresosDia
} from '../../../lib/data';
import { getClient } from '../../../lib/supabase';
import { MEDIOS_PAGO, TURNOS } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  BtnPrimary, BtnSecondary, Toast, useToast, Spinner,
  FieldLabel, DivRow
} from '../../../components/ui';
import { useLocale } from '../../../hooks/useLocale';

const STORAGE_KEY = 'troco_lista_turno';
const CAJA_KEY = 'troco_caja_abierta';

export default function CargarPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const online = useOnline();
  const { toast, visible, show } = useToast();
  const { t, isPT, fmt: fmtL } = useLocale();

  const CAUSAS_REAPERTURA = [
    t.causa_error,
    t.causa_venta,
    t.causa_anulacion,
    t.causa_otro,
  ];

  const [config,           setConfig]           = useState(null);
  const [turno,            setTurno]            = useState(null);
  const [turnosCerrados,   setTurnosCerrados]   = useState([]);
  const [medio,            setMedio]            = useState('efectivo');
  const [monto,            setMonto]            = useState('');
  const [nota,             setNota]             = useState('');
  const [lista,            setLista]            = useState([]);
  const [cerrando,         setCerrando]         = useState(false);
  const [diaCerrado,       setDiaCerrado]       = useState(false);
  const [cajaInicial,      setCajaInicial]      = useState('');
  const [nombreCajero,     setNombreCajero]     = useState('');
  const [mostrarApertura,  setMostrarApertura]  = useState(false);
  const [aperturaLista,    setAperturaLista]    = useState(false);
  const [sincronizando,    setSincronizando]    = useState(false);
  const [colaPendiente,    setColaPendiente]    = useState([]);
  const [anulando,         setAnulando]         = useState(null);
  const [motivoAnulacion,  setMotivoAnulacion]  = useState('');
  const [agregando,        setAgregando]        = useState(false);
  const [fechaTurno,       setFechaTurno]       = useState(todayStr());
  const [modalReapertura,  setModalReapertura]  = useState(false);
  const [causaReapertura,  setCausaReapertura]  = useState('');
  const [reabriendo,       setReabriendo]       = useState(false);

  const isAdmin = usuario?.rol === 'admin';
  const symbol = isPT ? 'R$' : '$';

  useEffect(() => {
    if (!usuario) return;

    try {
      const fechaGuardada = localStorage.getItem(CAJA_KEY);
      if (fechaGuardada && !fechaGuardada.startsWith(todayStr())) {
        localStorage.removeItem(CAJA_KEY);
      }
    } catch {}

    getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});

    getIngresosDia(usuario.bar_id, todayStr()).then(data => {
      const mapeadas = data.map(i => ({
        ...i,
        medio_label: MEDIOS_PAGO.find(m => m.key === i.medio_pago)?.label,
        medio_color: MEDIOS_PAGO.find(m => m.key === i.medio_pago)?.color,
        supabase_id: i.id,
        _id: i.id,
      }));
      setLista(mapeadas);
    }).catch(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setLista(JSON.parse(saved));
      } catch {}
    });

    setColaPendiente(getCola());

    const sb = getClient();
    sb.from('usuarios').select('nombre').eq('id', usuario.id).single()
      .then(({ data }) => { if (data) setNombreCajero(data.nombre); })
      .catch(() => {});

    getTurnosCerradosHoy(usuario.bar_id).then(cerrados => {
      setTurnosCerrados(cerrados);
      if (cerrados.includes('1') && cerrados.includes('2')) {
        setTurno('sin_turno');
        getTurnoAbierto(usuario.bar_id, todayStr(), 'sin_turno').then(turnoExistente => {
          if (turnoExistente) {
            setAperturaLista(true);
            try { localStorage.setItem(CAJA_KEY, todayStr() + '_sin_turno'); } catch {}
          } else {
            setMostrarApertura(true);
          }
        }).catch(() => { setMostrarApertura(true); });
      } else if (cerrados.includes('1')) {
        setTurno('2');
        getTurnoAbierto(usuario.bar_id, todayStr(), '2').then(turnoExistente => {
          if (turnoExistente) {
            setAperturaLista(true);
            try { localStorage.setItem(CAJA_KEY, todayStr() + '_2'); } catch {}
          } else {
            setMostrarApertura(true);
          }
        }).catch(() => { setMostrarApertura(true); });
      } else {
        setTurno('1');
        getTurnoAbierto(usuario.bar_id, todayStr(), '1').then(turnoExistente => {
          if (turnoExistente) {
            setAperturaLista(true);
            try { localStorage.setItem(CAJA_KEY, todayStr() + '_1'); } catch {}
          } else {
            setMostrarApertura(true);
          }
        }).catch(() => { setMostrarApertura(true); });
      }
    }).catch(() => { setTurno('1'); setMostrarApertura(true); });

    getCierreDiario(usuario.bar_id, todayStr()).then(cierre => {
      if (cierre) setDiaCerrado(true);
    }).catch(() => {});
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const interval = setInterval(() => {
      getCierreDiario(usuario.bar_id, todayStr()).then(cierre => {
        if (cierre) setDiaCerrado(true);
        else setDiaCerrado(false);
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
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
        const turnoAbierto = await abrirTurno(item.bar_id, item.usuario_id, item.fecha, item.turno, item.caja_inicial || 0);
        await crearIngresosBulk(item.rows.map(r => ({ ...r, turno_id: turnoAbierto.id })));
        await cerrarTurno(turnoAbierto.id);
      }
      limpiarCola();
      setColaPendiente([]);
      show('✓ ' + (isPT ? 'Dados sincronizados' : 'Datos sincronizados'));
    } catch {
      show('✗ ' + t.error);
    } finally {
      setSincronizando(false);
    }
  }

  async function confirmarReapertura() {
    if (!causaReapertura) return show('⚠ ' + (isPT ? 'Selecione uma causa' : 'Seleccioná una causa'));
    setReabriendo(true);
    try {
      await reabrirDia(usuario.bar_id, todayStr(), causaReapertura);
      setDiaCerrado(false);
      setModalReapertura(false);
      setCausaReapertura('');
      setAperturaLista(false);
      setMostrarApertura(true);
      show('✓ ' + t.reabrir_dia);
    } catch {
      show('✗ ' + t.error);
    } finally {
      setReabriendo(false);
    }
  }

  const montoBruto = parseFloat(monto) || 0;
  const pct        = config ? getRetencionPct(config, medio) : 0;
  const preview    = montoBruto > 0 ? calcularRetencion(montoBruto, pct) : null;
  const activas    = lista.filter(i => !i.anulada);
  const anuladas   = lista.filter(i => i.anulada);
  const totalBruto     = activas.reduce((s, i) => s + i.monto_bruto, 0);
  const totalRetencion = activas.reduce((s, i) => s + i.retencion_monto, 0);
  const totalNeto      = activas.reduce((s, i) => s + i.monto_neto, 0);

  const bloqueado = diaCerrado;

  async function agregarAVentas() {
    if (!montoBruto || montoBruto <= 0) return show('⚠ ' + (isPT ? 'Informe um valor válido' : 'Ingresá un monto válido'));
    try {
      const sb = getClient();
      await sb.auth.getSession();
    } catch {}
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
        setLista(l => [...l, { ...item, supabase_id: saved.id, _id: saved.id }]);
        show('✓ ' + (isPT ? 'Venda salva' : 'Venta guardada'));
      } catch {
        setLista(l => [...l, item]);
        show('⚠ ' + (isPT ? 'Salvo localmente' : 'Guardado localmente'));
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
    if (!motivoAnulacion.trim()) return show('⚠ ' + (isPT ? 'Informe um motivo' : 'Ingresá un motivo'));
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
      show('✓ ' + (isPT ? 'Venda cancelada' : 'Venta anulada'));
    } catch { show('✗ ' + t.error); }
  }

  async function cerrarTurnoHandler() {
    if (activas.length === 0) return show('⚠ ' + (isPT ? 'Não há vendas para fechar' : 'No hay ventas para cerrar'));
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
      show(`📴 ${isPT ? 'Sem conexão · Turno salvo localmente' : 'Sin conexión · Turno guardado localmente'}`);
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
        const turnoLabel = turno === '1' ? 'Turno 1' : turno === '2' ? 'Turno 2' : (isPT ? 'Turno único' : 'Turno único');
        const msg = [
          `*${t.wa_cierre_turno} ${turnoLabel}*`, ``,
          `${t.wa_ventas_brutas}:  ${fmtL(totalBruto)}`,
          `${t.wa_retenciones}:    -${fmtL(totalRetencion)}`,
          `${t.wa_ventas_netas}:   ${fmtL(totalNeto)}`, ``,
          `_${activas.length} ${t.wa_ventas}_`,
        ].join('\n');
        const waUrl = `https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(msg)}`;
        const waWindow = window.open(waUrl, '_blank');
        if (!waWindow) window.location.href = waUrl;
      }

      show(`✓ ${t.cerrar_turno} · ${activas.length} ${t.wa_ventas} · ${fmtL(totalBruto)}`);
      setTimeout(() => router.push('/resumen'), 1500);
    } catch { show('✗ ' + t.error); }
    finally { setCerrando(false); }
  }

  if (!config || turno === null) return <Spinner />;

  if (bloqueado) {
    return (
      <Screen>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <span className="text-5xl">🔒</span>
          <div className="text-lg font-bold text-t1">{t.dia_cerrado_titulo}</div>
          <div className="text-sm text-t3">{t.dia_cerrado_texto}</div>
          <button
            onClick={() => { setCausaReapertura(''); setModalReapertura(true); }}
            className="mt-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold">
            {t.reabrir_dia}
          </button>
        </div>

        {modalReapertura && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-24 px-4">
            <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl">
              <div className="text-center">
                <div className="text-2xl mb-1">🔓</div>
                <div className="text-base font-bold text-t1">{t.reapertura_titulo}</div>
              </div>
              <div className="flex flex-col gap-2">
                {CAUSAS_REAPERTURA.map(causa => (
                  <button
                    key={causa}
                    onClick={() => setCausaReapertura(causa)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border
                      ${causaReapertura === causa
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-offset border-transparent text-t2'}`}>
                    {causa}
                  </button>
                ))}
              </div>
              <BtnPrimary
                label={reabriendo ? t.cargando : t.confirmar_reapertura}
                onClick={confirmarReapertura}
                loading={reabriendo}
              />
              <button onClick={() => setModalReapertura(false)} className="w-full h-10 text-t3 text-sm">
                {t.cancelar}
              </button>
            </div>
          </div>
        )}
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
            <div className="text-sm font-semibold text-ambertext">{isPT ? 'Sem conexão' : 'Sin conexión'}</div>
            <div className="text-xs text-t3">{isPT ? 'Você pode continuar — sincroniza ao reconectar' : 'Podés seguir cargando — se sincroniza al reconectar'}</div>
          </div>
        </div>
      )}

      {sincronizando && (
        <div className="bg-greensoft border border-primary/20 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-xl">🔄</span>
          <div className="text-sm font-semibold text-greentext">{isPT ? 'Sincronizando dados...' : 'Sincronizando datos...'}</div>
        </div>
      )}

      {colaPendiente.length > 0 && online && !sincronizando && (
        <div className="bg-ambersoft border border-amber/20 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ambertext">{isPT ? 'Dados pendentes' : 'Datos pendientes'}</div>
            <div className="text-xs text-t3">{colaPendiente.length} {isPT ? 'turno(s) sem sincronizar' : 'turno(s) sin sincronizar'}</div>
          </div>
          <button onClick={sincronizarCola}
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold">
            {isPT ? 'Sincronizar' : 'Sincronizar'}
          </button>
        </div>
      )}

      {mostrarApertura && !aperturaLista && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-xl">
            <div className="text-center">
              <div className="text-3xl mb-2">{turno === '2' ? '🌙' : '🏪'}</div>
              <div className="text-lg font-bold text-t1">
                {turno === '1' ? t.apertura_caja : turno === '2' ? t.recepcion_caja : t.apertura_caja}
              </div>
              <div className="text-sm text-t3 mt-1 capitalize">
                {new Date().toLocaleDateString(isPT ? 'pt-BR' : 'es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {turno === '1' ? 'Turno 1 ☀️' : turno === '2' ? 'Turno 2 🌙' : `${isPT ? 'Turno único' : 'Turno único'} ⭐`}
              </div>
              {nombreCajero && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  👤 {nombreCajero}
                </div>
              )}
            </div>
            <div>
              <FieldLabel>{turno === '2' ? t.monto_recibido : t.monto_apertura}</FieldLabel>
              <div className="flex items-center bg-offset rounded-xl px-4 border border-transparent focus-within:border-primary/40 transition">
                <span className="text-2xl font-light text-t3 mr-1">{symbol}</span>
                <input type="number" inputMode="decimal" value={cajaInicial}
                  onChange={e => setCajaInicial(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent py-4 text-3xl font-bold tracking-tight placeholder:text-t4 focus:outline-none tabular-nums text-t1"
                  autoFocus />
              </div>
            </div>
            <BtnPrimary label={turno === '2' ? t.recibir_caja : t.abrir_caja} onClick={async () => {
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
              <div className="text-base font-bold text-t1">{isPT ? 'Cancelar venda' : 'Anular venta'}</div>
              <div className="text-sm text-t3 mt-1">{anulando.medio_label} · {fmtL(anulando.monto_bruto)}</div>
            </div>
            <div>
              <FieldLabel>{isPT ? 'Motivo do cancelamento' : 'Motivo de anulación'}</FieldLabel>
              <textarea value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)}
                placeholder={isPT ? 'Ex: erro de lançamento, cliente cancelou...' : 'Ej: error de carga, cliente canceló...'}
                rows={3}
                className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-red/40 placeholder:text-t4 transition resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAnulando(null)} className="flex-1 h-11 rounded-xl bg-offset text-t2 text-sm font-medium">{t.cancelar}</button>
              <button onClick={confirmarAnulacion} className="flex-1 h-11 rounded-xl bg-redsoft border border-red/20 text-redtext text-sm font-semibold">{isPT ? 'Confirmar cancelamento' : 'Confirmar anulación'}</button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="mb-2">
            <FieldLabel>{t.turno}</FieldLabel>
          </div>
          <ChipGroup
            options={TURNOS.map(turnoOpt => ({
              value: turnoOpt.key,
              label: `${turnoOpt.icon} ${turnoOpt.label}${turnosCerrados.includes(turnoOpt.key) ? ' ✓' : ''}`,
              color: turnosCerrados.includes(turnoOpt.key) ? '#6B7280' : undefined,
            }))}
            value={turno}
            onChange={setTurno}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title={t.nueva_venta} subtitle={`${TURNOS.find(turnoOpt => turnoOpt.key === turno)?.icon} ${TURNOS.find(turnoOpt => turnoOpt.key === turno)?.label} · ${isPT ? 'Adiciona à lista' : 'Se agrega a la lista'}`} />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>{t.medio_pago}</FieldLabel>
            <ChipGroup options={MEDIOS_PAGO.map(m => ({ value: m.key, label: m.label, color: m.color }))} value={medio} onChange={setMedio} className="grid grid-cols-3" />
          </div>
          <div>
            <FieldLabel>{t.importe}</FieldLabel>
            <MontoInput value={monto} onChange={setMonto} color={medio ? MEDIOS_PAGO.find(m => m.key === medio)?.color : null} symbol={symbol} />
          </div>
          {preview && (
            <div className="bg-offset rounded-xl border border-divider p-3">
              <DivRow label={t.importe} value={fmtL(preview.monto_bruto)} />
              {preview.retencion_pct > 0 && <DivRow label={`${t.retenciones} (${preview.retencion_pct}%)`} value={`−${fmtL(preview.retencion_monto)}`} valueClass="text-redtext" />}
              <DivRow label={t.ventas_netas} value={fmtL(preview.monto_neto)} valueClass="text-greentext" bold />
            </div>
          )}
          <div>
            <FieldLabel>{t.nota_opcional}</FieldLabel>
            <input value={nota} onChange={e => setNota(e.target.value)} placeholder={isPT ? 'Mesa 5, delivery, etc...' : 'Mesa 5, delivery, etc...'}
              className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4" />
          </div>
          <button onClick={agregarAVentas} disabled={agregando}
            className="w-full h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50">
            {agregando ? '...' : t.agregar_ventas}
          </button>
        </div>
      </Card>

      {activas.length > 0 && (
        <Card>
          <CardHeader title={`${t.lista} · ${activas.length} ${t.wa_ventas}`} subtitle={`${fmtL(totalBruto)}`} />
          <div className="p-4 flex flex-col gap-2">
            {activas.map(item => (
              <div key={item._id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: item.medio_color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-t1">{item.medio_label}</div>
                  {item.nota && <div className="text-xs text-t3 truncate">{item.nota}</div>}
                  <div className="text-xs text-t3 mt-0.5">{item.fecha?.slice(11,16)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold tabular-nums text-greentext">{fmtL(item.monto_bruto)}</div>
                  {item.retencion_monto > 0 && <div className="text-xs text-redtext tabular-nums">−{fmtL(item.retencion_monto)}</div>}
                </div>
                <button onClick={() => pedirAnulacion(item)} className="w-8 h-8 rounded-lg bg-redsoft flex items-center justify-center text-redtext text-sm flex-shrink-0">✕</button>
              </div>
            ))}
            <div className="mt-1 bg-offset rounded-xl border border-divider p-3">
              <DivRow label={t.ventas_brutas}  value={fmtL(totalBruto)} />
              <DivRow label={t.retenciones}     value={`−${fmtL(totalRetencion)}`} valueClass="text-redtext" />
              <DivRow label={t.ventas_netas}    value={fmtL(totalNeto)} valueClass="text-greentext" bold />
            </div>
            <BtnPrimary label={cerrando ? t.cargando : `${t.cerrar_turno} · ${activas.length} ${t.wa_ventas}`} onClick={cerrarTurnoHandler} loading={cerrando} className="mt-1" />
            <BtnSecondary label={t.limpiar_todo} onClick={() => { setLista([]); localStorage.removeItem(STORAGE_KEY); }} />
          </div>
        </Card>
      )}

      {anuladas.length > 0 && (
        <Card>
          <CardHeader title={`${t.anuladas} · ${anuladas.length}`} />
          <div className="p-4 flex flex-col gap-2">
            {anuladas.map(item => (
              <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl bg-redsoft/50 border border-red/10 opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-t2 line-through">{item.medio_label} · {fmtL(item.monto_bruto)}</div>
                  <div className="text-xs text-redtext mt-0.5">{item.motivo_anulacion}</div>
                  <div className="text-xs text-t3 mt-0.5">{item.fecha?.slice(11,16)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {lista.length === 0 && (
        <div className="text-center py-8 text-t3 text-sm">
          {isPT ? 'Adicione vendas à lista e feche o turno ao terminar.' : 'Agregá ventas a la lista y cerrá el turno al terminar.'}
        </div>
      )}
    </Screen>
  );
}
