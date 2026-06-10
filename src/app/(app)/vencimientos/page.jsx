'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getClient } from '../../../lib/supabase';

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

function diasHasta(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha + 'T12:00:00');
  return Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
}

function semaforo(fecha) {
  const dias = diasHasta(fecha);
  if (dias < 0)  return { bg: 'bg-red-100',    border: 'border-red-300',    dot: 'bg-red-500',    label: 'text-red-600',    texto: 'Vencido' };
  if (dias === 0) return { bg: 'bg-red-100',   border: 'border-red-300',    dot: 'bg-red-500',    label: 'text-red-600',    texto: 'Hoy' };
  if (dias <= 2)  return { bg: 'bg-pink-50',   border: 'border-pink-300',   dot: 'bg-pink-500',   label: 'text-pink-600',   texto: `En ${dias}d` };
  if (dias <= 6)  return { bg: 'bg-amber-50',  border: 'border-amber-300',  dot: 'bg-amber-400',  label: 'text-amber-600',  texto: `En ${dias}d` };
  return           { bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500',  label: 'text-green-600',  texto: `En ${dias}d` };
}

function labelFecha(fecha) {
  const dias = diasHasta(fecha);
  if (dias < 0)   return `Vencido hace ${Math.abs(dias)}d`;
  if (dias === 0) return '⚠ Hoy';
  if (dias === 1) return '⚠ Mañana';
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
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

      {/* Leyenda semáforo */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-t3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"/> +6 días
        </div>
        <div className="flex items-center gap-1.5 text-xs text-t3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"/> 3-6 días
        </div>
        <div className="flex items-center gap-1.5 text-xs text-t3">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500"/> 1-2 días
        </div>
        <div className="flex items-center gap-1.5 text-xs text-t3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"/> Hoy / Vencido
        </div>
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
              <div key={v.id} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-semibold text-t1">{v.detalle}</div>
                    <div className={`text-xs font-medium ${s.label}`}>{labelFecha(v.fecha)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-t1">{fmt(v.importe)}</div>
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
