'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getClient } from '../../../lib/supabase';

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

function diasHasta(fecha) {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const partes = fecha.split('-');
  const f = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  return Math.round((f - hoy) / (1000 * 60 * 60 * 24));
}

function semaforo(fecha) {
  const dias = diasHasta(fecha);
  if (dias < 0)   return { bg: '#fecaca', border: '#f87171', dot: '#b91c1c', label: '#991b1b' };
if (dias === 0) return { bg: '#fecaca', border: '#f87171', dot: '#b91c1c', label: '#991b1b' };
if (dias <= 2)  return { bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444', label: '#dc2626' };
  if (dias <= 6)  return { bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b', label: '#d97706' };
  return           { bg: '#f0fdf4', border: '#86efac', dot: '#22c55e', label: '#16a34a' };
}

function labelDias(fecha) {
  const dias = diasHasta(fecha);
  if (dias < 0)   return `Vencido hace ${Math.abs(dias)}d`;
  if (dias === 0) return '⚠ Hoy';
  if (dias === 1) return '1 día';
  return `${dias} días`;
}

function labelFecha(fecha) {
  const dias = diasHasta(fecha);
  if (dias < 0)   return 'Vencido';
  if (dias === 0) return '⚠ Hoy';
  const partes = fecha.split('-');
  const f = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  return f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export default function VencimientosPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'admin';
  const [vencimientos, setVencimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ detalle: '', importe: '', fecha: '' });
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const sb = getClient();
    const { data } = await sb
      .from('vencimientos')
      .select('*')
      .eq('bar_id', usuario.bar_id)
      .order('fecha', { ascending: true });
    setVencimientos(data || []);
    setLoading(false);
  }

  useEffect(() => { if (usuario) cargar(); }, [usuario]);

  async function guardar() {
    if (!form.detalle || !form.importe || !form.fecha) return;
    setGuardando(true);
    const sb = getClient();
    await sb.from('vencimientos').insert([{
      bar_id: usuario.bar_id,
      detalle: form.detalle,
      importe: parseFloat(form.importe),
      fecha: form.fecha,
    }]);
    setForm({ detalle: '', importe: '', fecha: '' });
    setAgregando(false);
    setGuardando(false);
    cargar();
  }

  async function eliminar(id) {
    const sb = getClient();
    await sb.from('vencimientos').delete().eq('id', id);
    cargar();
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-t1">Vencimientos</div>
        {isAdmin && !agregando && (
          <button onClick={() => setAgregando(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">
            + Agregar
          </button>
        )}
      </div>

      {agregando && (
        <div className="bg-surface rounded-2xl shadow-card p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold text-t1">Nuevo vencimiento</div>
          <input
            type="text"
            placeholder="Detalle (ej: Alquiler, Luz, etc)"
            value={form.detalle}
            onChange={e => setForm({ ...form, detalle: e.target.value })}
            className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm focus:outline-none"
          />
          <input
            type="number"
            placeholder="Importe"
            value={form.importe}
            onChange={e => setForm({ ...form, importe: e.target.value })}
            className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
            className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setAgregando(false)}
              className="flex-1 h-11 rounded-xl border border-divider text-t3 text-sm">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50">
              {guardando ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-t3 text-sm py-8">Cargando...</div>
      ) : vencimientos.length === 0 ? (
        <div className="text-center text-t3 text-sm py-8">No hay vencimientos cargados</div>
      ) : (
        <div className="flex flex-col gap-2">
          {vencimientos.map(v => {
            const s = semaforo(v.fecha);
            return (
              <div key={v.id} style={{ backgroundColor: s.bg, borderColor: s.border }}
                className="border rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div style={{ backgroundColor: s.dot }} className="w-3 h-3 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="text-sm font-semibold text-t1 truncate">{v.detalle}</div>
                    <div style={{ color: s.label }} className="text-xs font-medium">{labelFecha(v.fecha)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-t1">{fmt(v.importe)}</div>
                    <div style={{ color: s.label }} className="text-xs font-semibold">{labelDias(v.fecha)}</div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => eliminar(v.id)} className="text-t4 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
