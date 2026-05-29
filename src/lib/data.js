// src/lib/data.js
import { getClient } from './supabase';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
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

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await sb.auth.signUp({ email, password });
  if (authError) throw authError;

  // 2. Crear bar
  const { data: bar, error: barError } = await sb
    .from('bares')
    .insert([{ nombre: nombreBar, email }])
    .select().single();
  if (barError) throw barError;

  // 3. Crear usuario admin
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
    monto_neto:      Math.round((montoBruto - retencionMonto) * 100) / 100,
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

export async function abrirTurno(barId, usuarioId, fecha, numero, cajaInicial = 0) {
  const sb = getClient();
  // Si ya existe uno abierto, lo devolvemos
  const existente = await getTurnoAbierto(barId, fecha, numero);
  if (existente) return existente;

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
  const { data, error } = await sb.from('ingresos').insert(ingresos).select();
  if (error) throw error;
  return data;
}

export async function getIngresosDia(barId, fechaStr) {
  const sb = getClient();
  const inicio = startOfDay(new Date(fechaStr + 'T12:00:00')).toISOString();
  const fin    = endOfDay(new Date(fechaStr + 'T12:00:00')).toISOString();
  const { data, error } = await sb
    .from('ingresos').select('*')
    .eq('bar_id', barId)
    .gte('fecha', inicio).lte('fecha', fin)
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

export async function crearEgreso({ barId, turnoId, usuarioId, tipo, monto, detalle, fecha }) {
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
    }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function getEgresosDia(barId, fechaStr) {
  const sb = getClient();
  const inicio = new Date(fechaStr + 'T00:00:00-03:00').toISOString();
  const fin    = new Date(fechaStr + 'T23:59:59-03:00').toISOString();
  const { data, error } = await sb
    .from('egresos')
    .select('*')
    .eq('bar_id', barId)
    .gte('fecha', inicio)
    .lte('fecha', fin)
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

  return { porMedio, totalBruto, totalRetencion, totalNeto, totalEgresos, resultado };
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

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTurnosCerradosHoy(barId) {
  const sb = getClient();
  const inicio = startOfDay(new Date()).toISOString();
  const fin    = endOfDay(new Date()).toISOString();
  const { data } = await sb
    .from('turnos')
    .select('numero')
    .eq('bar_id', barId)
    .eq('cerrado', true)
    .gte('created_at', inicio)
    .lte('created_at', fin);
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
  export async function registrarCajero({ barId, nombre, email, password }) {
  const sb = getClient();
  const { data: authData, error: authError } = await sb.auth.signUp({ email, password });
  if (authError) throw authError;
  const { error: userError } = await sb
    .from('usuarios')
    .insert([{ id: authData.user.id, bar_id: barId, nombre, email, rol: 'cajero' }]);
  if (userError) throw userError;
  return authData.user;
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
export async function getCajaInicialDia(barId, fechaStr) {
  const sb = getClient();
  const { data } = await sb
    .from('turnos')
    .select('caja_inicial')
    .eq('bar_id', barId)
    .eq('fecha', fechaStr)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.caja_inicial || 0;
}
}

