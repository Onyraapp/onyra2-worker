'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getClient } from '../../../lib/supabase';

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
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

  const hoy = new Date().toISOString().slice(0, 10);
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  function colorFecha(fecha) {
    if (fecha === hoy) return 'text-red-500 font-bold';
    if (fecha === manana) return 'text-amber-500 font-semibold';
    return 'text-t3';
  }

  function labelFecha(fecha) {
    if (fecha === hoy) return '⚠ Hoy';
    if (fecha === manana) return '⚠ Mañana';
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
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
          {vencimientos.map(v => (
            <div key={v.id} className="bg-surface rounded-2xl shadow-card px-4 py-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-semibold text-t1">{v.detalle}</div>
                <div className={`text-xs ${colorFecha(v.fecha)}`}>{labelFecha(v.fecha)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-t1">{fmt(v.importe)}</div>
                {isAdmin && (
                  <button onClick={() => eliminar(v.id)} className="text-t4 text-lg leading-none">×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
