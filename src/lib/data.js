// src/lib/data.js
import { getClient } from './supabase';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const TZ_ART = 'America/Argentina/Buenos_Aires';
import { CONFIG_KEYS } from './constants';

// ── AUTH ─────────────────────────────────────────────────

export async function signIn(email, password) {
  const sb = getClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = getClient();
  await sb.auth.signOut();
}

export async function getSession() {
  const sb = getClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getUsuarioActual() {
  const sb = getClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('usuarios').select('*, bares(*)').eq('id', user.id).single();
  return data;
}

// ── REGISTRO ─────────────────────────────────────────────

export async function registrarBar({ nombreBar, nombre, email, password }) {
  const sb = getClient();
  const { data: authData, error: authError } = await sb.auth.signUp({ email, password });
  if (authError) throw authError;

  const trialHasta = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: bar, error: barError } = await sb
    .from('bares')
    .insert([{ nombre: nombreBar, email, plan: 'trial', trial_hasta: trialHasta, plan_activo: true }])
    .select().single();
  if (barError) throw barError;

  const { error: userError } = await sb
    .from('usuarios')
    .insert([{ id: authData.user.id, bar_id: bar.id, nombre, email, rol: 'admin' }]);
  if (userError) throw userError;

  return { bar, user: authData.user };
}

export async function crearCajero({ nombre, email, password, barId }) {
  const sb = getClient();
  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (authError) throw authError;

  const { error } = await sb.from('usuarios')
    .insert([{ id: authData.user.id, bar_id: barId, nombre, email, rol: 'cajero' }]);
  if (error) throw error;
  return authData.user;
}

// ── CONFIGURACION ─────────────────────────────────────────

export async function getConfiguracion(barId) {
  const sb = getClient();
  const { data, error } = await sb
    .from('configuracion').select('*').eq('bar_id', barId).single();
  if (error) throw error;
  return data;
}

export async function updateConfiguracion(barId, updates) {
  const sb = getClient();
  const { data, error } = await sb
    .from('configuracion')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('bar_id', barId)
    .select().single();
  if (error) throw error;
  return data;
}

// ── RETENCIONES ───────────────────────────────────────────

export function calcularRetencion(montoBruto, pct) {
  const retencionMonto = (montoBruto * pct) / 100;
  return {
    monto_bruto:     montoBruto,
    retencion_pct:   pct,
    retencion_monto: Math.round(retencionMonto * 100) / 100,
    monto_neto:      montoBruto,
  };
}

export function getRetencionPct(config, medioPago) {
  const key = CONFIG_KEYS[medioPago];
  return config?.[key] ?? 0;
}

// ── TURNOS ────────────────────────────────────────────────

export async function getTurnoAbierto(barId, fecha, numero) {
  const sb = getClient();
  const { data } = await sb
    .from('turnos')
    .select('*')
    .eq('bar_id', barId)
    .eq('fecha', fecha)
    .eq('numero', numero)
    .eq('cerrado', false)
    .maybeSingle();
  return data;
}

export async function getTurnoAbiertoHoy(barId, numero) {
  const t1 = await getTurnoAbierto(barId, realDateStr(), numero);
  if (t1) return t1;
  return getTurnoAbierto(barId, todayStr(), numero);
}

export async function abrirTurno(barId, usuarioId, fecha, numero, cajaInicial = 0) {
  const sb = getClient();

  // 1. Si ya existe un turno abierto para esta fecha y número, devolverlo directamente
  const existente = await getTurnoAbierto(barId, fecha, numero);
  if (existente) return existente;

  // 2. Si existe un turno abierto con este número en CUALQUIER fecha (fantasma),
  //    cerrarlo automáticamente antes de crear el nuevo
  const { data: fantasmas } = await sb
    .from('turnos')
    .select('id')
    .eq('bar_id', barId)
    .eq('numero', numero)
    .eq('cerrado', false);
  if (fantasmas && fantasmas.length > 0) {
    const ids = fantasmas.map(t => t.id);
    await sb.from('turnos').update({ cerrado: true, cerrado_at: new Date().toISOString() }).in('id', ids);
  }

  // 3. Insertar el turno nuevo
  const { data, error } = await sb
    .from('turnos')
    .insert([{ bar_id: barId, usuario_id: usuarioId, fecha, numero, caja_inicial: cajaInicial }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function cerrarTurno(turnoId) {
  const sb = getClient();
  const { data, error } = await sb
    .from('turnos')
    .update({ cerrado: true, cerrado_at: new Date().toISOString() })
    .eq('id', turnoId)
    .select().single();
  if (error) throw error;
  return data;
}

export async function getTurnosDia(barId, fechaStr) {
  const sb = getClient();
  const { data } = await sb
    .from('turnos')
    .select('*, usuarios(nombre)')
    .eq('bar_id', barId)
    .eq('fecha', fechaStr)
    .order('created_at', { ascending: true });
  return data || [];
}

// ── INGRESOS ──────────────────────────────────────────────

export async function crearIngreso({ barId, turnoId, usuarioId, medioPago, montoBruto, config, nota }) {
  const sb = getClient();
  const pct = getRetencionPct(config, medioPago);
  const calc = calcularRetencion(montoBruto, pct);

  const { data, error } = await sb
    .from('ingresos')
    .insert([{
      bar_id:          barId,
      turno_id:        turnoId,
      usuario_id:      usuarioId,
      medio_pago:      medioPago,
      monto_bruto:     calc.monto_bruto,
      retencion_pct:   calc.retencion_pct,
      retencion_monto: calc.retencion_monto,
      monto_neto:      calc.monto_neto,
      nota:            nota || '',
      fecha:           new Date().toISOString(),
    }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function crearIngresosBulk(ingresos) {
  const sb = getClient();
  // upsert con ignoreDuplicates para que sea idempotente — si la sincronización
  // falla y se reintenta, no se insertan filas duplicadas
  const { data, error } = await sb.from('ingresos').upsert(ingresos, {
    onConflict: 'id',
    ignoreDuplicates: true,
  }).select();
  if (error) throw error;
  return data;
}

export async function crearIngresoInstant({ barId, usuarioId, medioPago, montoBruto, retencionPct, retencionMonto, montoNeto, nota, fechaTurno }) {
  const sb = getClient();
  // La venta se registra siempre con el instante real (timestamp absoluto).
  // No se arma una fecha sintética a partir de fechaTurno: el trigger
  // validar_dia_comercial_ingreso ya recalcula el día comercial correcto a
  // partir de un timestamp real, con la misma lógica de hora de corte que usa
  // todayStr() en el frontend. Pegar fechaTurno como fecha calendario del
  // evento rompía ese cálculo para ventas cargadas entre las 00:00 y la hora
  // de corte (por ejemplo, turnos que cruzan la medianoche, como 11am-3am).
  const ahora = new Date();
  const fecha = ahora.toISOString();

  // Anti-duplicado: verificar si existe una venta idéntica en los últimos 30 segundos
  const hace30s = new Date(ahora.getTime() - 30000).toISOString();
  const { data: existente } = await sb.from('ingresos')
    .select('id')
    .eq('bar_id', barId)
    .eq('medio_pago', medioPago)
    .eq('monto_bruto', montoBruto)
    .eq('anulada', false)
    .gte('fecha', hace30s)
    .limit(1);
  if (existente && existente.length > 0) {
    console.warn('[crearIngresoInstant] venta duplicada bloqueada', { medioPago, montoBruto });
    return existente[0];
  }

  const { data, error } = await sb.from('ingresos').insert([{
    bar_id: barId,
    turno_id: null,
    usuario_id: usuarioId,
    medio_pago: medioPago,
    monto_bruto: montoBruto,
    retencion_pct: retencionPct,
    retencion_monto: retencionMonto,
    monto_neto: montoNeto,
    nota: nota || '',
    fecha,
    pendiente: true,
    anulada: false,
    motivo_anulacion: '',
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function cerrarTurnoConPendientes({ barId, usuarioId, fecha, turno, cajaInicial }) {
  const sb = getClient();
  const t = await abrirTurno(barId, usuarioId, fecha, turno, cajaInicial);
  // Solo se asignan al turno las ventas pendientes que caen dentro de la ventana
  // del día comercial de ESTE turno — no todas las ventas pendientes del bar sin
  // importar la fecha. Así, una venta huérfana de un día anterior (por ejemplo,
  // por una falla de red) no viaja en este UPDATE y no puede bloquear el cierre
  // de un turno de otro día.
  const { inicio, fin } = ventanaDiaComercial(fecha);
  const { error } = await sb
    .from('ingresos')
    .update({ turno_id: t.id, pendiente: false })
    .eq('bar_id', barId)
    .eq('pendiente', true)
    .is('turno_id', null)
    .gte('fecha', inicio)
    .lt('fecha', fin);
  if (error) throw error;
  // Los gastos se pueden cargar libremente sin caja abierta (no bloquean nunca
  // la carga). Acá, al cerrar el turno del día, se "asientan" solos: cualquier
  // gasto suelto sin turno_id dentro de esta misma ventana de día comercial
  // queda asignado a este turno. Es best-effort — si falla, no debe frenar el
  // cierre del turno (que ya es lo importante y ya se aplicó arriba).
  try {
    await sb
      .from('egresos')
      .update({ turno_id: t.id })
      .eq('bar_id', barId)
      .is('turno_id', null)
      .gte('fecha', inicio)
      .lt('fecha', fin);
  } catch (e) {
    console.error('[cerrarTurnoConPendientes] no se pudieron asentar gastos sueltos:', e);
  }
  await cerrarTurno(t.id);
  return t;
}

export async function getIngresosDia(barId, fechaStr) {
  const sb = getClient();
  const { inicio, fin } = ventanaDiaComercial(fechaStr);
  const { data, error } = await sb
    .from('ingresos').select('*')
    .eq('bar_id', barId)
    .gte('fecha', inicio).lt('fecha', fin)
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getIngresosTurno(turnoId) {
  const sb = getClient();
  const { data, error } = await sb
    .from('ingresos').select('*')
    .eq('turno_id', turnoId)
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── EGRESOS ───────────────────────────────────────────────

export async function crearEgreso({ barId, turnoId, usuarioId, tipo, monto, detalle, fecha, medio_pago }) {
  const sb = getClient();
  const { data, error } = await sb
    .from('egresos')
    .insert([{
      bar_id:     barId,
      turno_id:   turnoId,
      usuario_id: usuarioId,
      tipo,
      monto,
      detalle:    detalle || '',
      fecha:      fecha || new Date().toISOString(),
      medio_pago: medio_pago || 'efectivo',
    }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function getEgresosDia(barId, fechaStr) {
  const sb = getClient();
  const { inicio, fin } = ventanaDiaComercial(fechaStr);
  const { data, error } = await sb
    .from('egresos')
    .select('*')
    .eq('bar_id', barId)
    .gte('fecha', inicio).lt('fecha', fin)
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── RESUMEN DIA ───────────────────────────────────────────

export function calcularResumenDia(ingresos, egresos) {
  const porMedio = {};

  for (const ing of ingresos) {
    if (!porMedio[ing.medio_pago]) {
      porMedio[ing.medio_pago] = { bruto: 0, retencion: 0, neto: 0, count: 0 };
    }
    porMedio[ing.medio_pago].bruto     += ing.monto_bruto;
    porMedio[ing.medio_pago].retencion += ing.retencion_monto;
    porMedio[ing.medio_pago].neto      += ing.monto_neto;
    porMedio[ing.medio_pago].count++;
  }

  const totalBruto     = ingresos.reduce((s, i) => s + i.monto_bruto, 0);
  const totalRetencion = ingresos.reduce((s, i) => s + i.retencion_monto, 0);
  const totalNeto      = ingresos.reduce((s, i) => s + i.monto_neto, 0);
  const totalEgresos   = egresos.reduce((s, e) => s + e.monto, 0);
  const resultado      = totalNeto - totalEgresos;

  const egresosPorTipo = {};
  for (const e of egresos) {
    if (!egresosPorTipo[e.tipo]) egresosPorTipo[e.tipo] = { monto: 0, items: [] };
    egresosPorTipo[e.tipo].monto += e.monto;
    egresosPorTipo[e.tipo].items.push(e);
  }

  return { porMedio, totalBruto, totalRetencion, totalNeto, totalEgresos, resultado, egresosPorTipo };
}

// ── RESUMEN MES ───────────────────────────────────────────

export async function getResumenMes(barId, año, mes) {
  const sb = getClient();
  const ref    = new Date(año, mes - 1, 1);
  const inicio = startOfMonth(ref).toISOString();
  const fin    = endOfMonth(ref).toISOString();

  const [{ data: ingresos }, { data: egresos }] = await Promise.all([
    sb.from('ingresos').select('*').eq('bar_id', barId).gte('fecha', inicio).lte('fecha', fin),
    sb.from('egresos').select('*').eq('bar_id', barId).gte('fecha', inicio).lte('fecha', fin),
  ]);

  return calcularResumenDia(ingresos || [], egresos || []);
}

export async function getMovimientosMes(barId, año, mes) {
  const sb = getClient();
  const ref    = new Date(año, mes - 1, 1);
  const inicio = startOfMonth(ref).toISOString();
  const fin    = endOfMonth(ref).toISOString();

  const [{ data: ingresos }, { data: egresos }] = await Promise.all([
    sb.from('ingresos').select('*').eq('bar_id', barId).gte('fecha', inicio).lte('fecha', fin).order('fecha'),
    sb.from('egresos').select('*').eq('bar_id', barId).gte('fecha', inicio).lte('fecha', fin).order('fecha'),
  ]);

  return { ingresos: ingresos || [], egresos: egresos || [] };
}

// ── FORMATEO ─────────────────────────────────────────────

export function fmt(n) {
  if (n == null) return '$\u00a00';
  return '$\u00a0' + Math.round(n).toLocaleString('es-AR');
}

export function fmtPct(n) {
  return (n || 0).toFixed(1) + '%';
}

export function realDateStr() {
  return formatInTimeZone(new Date(), TZ_ART, 'yyyy-MM-dd');
}

function getHoraCorteLocal(horaCorte) {
  if (horaCorte != null) return horaCorte;
  try { return parseInt(localStorage.getItem('troco_hora_corte') || '3', 10); } catch { return 3; }
}

export function todayStr(horaCorte) {
  const corte = getHoraCorteLocal(horaCorte);
  const now = new Date();
  const horaArt = parseInt(formatInTimeZone(now, TZ_ART, 'HH'), 10);
  if (horaArt < corte) {
    const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return formatInTimeZone(ayer, TZ_ART, 'yyyy-MM-dd');
  }
  return formatInTimeZone(now, TZ_ART, 'yyyy-MM-dd');
}

function ventanaDiaComercial(fechaStr, horaCorte) {
  const corte = getHoraCorteLocal(horaCorte);
  const corteStr = String(corte).padStart(2, '0');
  const siguienteStr = addDays(new Date(`${fechaStr}T12:00:00`), 1).toISOString().slice(0, 10);
  const inicio = fromZonedTime(`${fechaStr} ${corteStr}:00:00`, TZ_ART).toISOString();
  const fin    = fromZonedTime(`${siguienteStr} ${corteStr}:00:00`, TZ_ART).toISOString();
  return { inicio, fin };
}

export function guardarHoraCorte(hora) {
  try { localStorage.setItem('troco_hora_corte', String(hora ?? 3)); } catch {}
}

export async function getTurnosCerradosHoy(barId) {
  const sb = getClient();
  const { data } = await sb
    .from('turnos')
    .select('numero')
    .eq('bar_id', barId)
    .eq('cerrado', true)
    .eq('fecha', todayStr());
  return (data || []).map(t => t.numero);
}

export async function getCierreDiario(barId, fechaStr) {
  const sb = getClient();
  const { data } = await sb
    .from('cierres_diarios')
    .select('*')
    .eq('bar_id', barId)
    .eq('fecha', fechaStr)
    .maybeSingle();
  return data;
}

export async function crearCierreDiario(barId, usuarioId, fechaStr) {
  const sb = getClient();
  const { data, error } = await sb
    .from('cierres_diarios')
    .insert([{ bar_id: barId, usuario_id: usuarioId, fecha: fechaStr }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function reabrirDia(barId, fechaStr, causa) {
  const sb = getClient();
  const { error } = await sb
    .from('cierres_diarios')
    .update({ reapertura_causa: causa })
    .eq('bar_id', barId)
    .eq('fecha', fechaStr);
  if (error) throw error;
  const { error: e2 } = await sb
    .from('cierres_diarios')
    .delete()
    .eq('bar_id', barId)
    .eq('fecha', fechaStr);
  if (e2) throw e2;
}

export async function registrarCajero({ barId, nombre, email, password }) {
  const res = await fetch('/api/crear-cajero', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barId, nombre, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear cajero');
  return data;
}

export async function getCajeros(barId) {
  const sb = getClient();
  const { data, error } = await sb
    .from('usuarios')
    .select('*')
    .eq('bar_id', barId)
    .order('nombre');
  if (error) throw error;
  return data || [];
}

export async function updateBar(barId, updates) {
  const sb = getClient();
  const { data, error } = await sb
    .from('bares')
    .update(updates)
    .eq('id', barId)
    .select().single();
  if (error) throw error;
  return data;
}

export async function getCajaInicialDia(barId, fechaStr) {
  const sb = getClient();
  const { data } = await sb
    .from('turnos')
    .select('caja_inicial')
    .eq('bar_id', barId)
    .eq('fecha', fechaStr);
  if (!data || data.length === 0) return 0;
  return data.reduce((s, t) => s + (t.caja_inicial || 0), 0);
}
// NUEVA FUNCIÓN PARA ELIMINAR EL ERROR DE LÍMITE DE HORARIO
export async function getTurnoAbiertoGlobal(barId) {
  const sb = getClient();
  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
  const ayerStr = formatInTimeZone(ayer, TZ_ART, 'yyyy-MM-dd');
  const { data, error } = await sb
    .from('turnos')
    .select('*')
    .eq('bar_id', barId)
    .eq('cerrado', false)
    .gte('fecha', ayerStr)
    .order('fecha', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}
