'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getClient } from '../../../lib/supabase';
import { useLocale } from '../../../hooks/useLocale';

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

function SwipeToDelete({ onDelete, children }) {
  const ref = useRef(null);
  const startX = useRef(null);
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);

  function onTouchStart(e) { startX.current = e.touches[0].clientX; }
  function onTouchMove(e) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -100));
  }
  async function onTouchEnd() {
    if (offset < -60) {
      setDeleting(true);
      setOffset(-100);
      await onDelete();
    } else {
      setOffset(0);
    }
    startX.current = null;
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1rem' }}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '1rem' }}>
        <span style={{ color: 'white', fontSize: 20 }}>🗑</span>
      </div>
      <div ref={ref}
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 || deleting ? 'transform 0.2s' : 'none',
          opacity: deleting ? 0 : 1 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}>
        {children}
      </div>
    </div>
  );
}

export default function VencimientosPage() {
  const { usuario } = useAuth();
  const { t, isPT, fmt: fmtL } = useLocale();
  const isAdmin = usuario?.rol === 'admin';
  const [vencimientos, setVencimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ detalle: '', importe: '', fecha: '' });
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function labelDias(fecha) {
    const dias = diasHasta(fecha);
    if (dias < 0)   return `${t.vencido_hace} ${Math.abs(dias)}d`;
    if (dias === 0) return `⚠ ${t.hoy}`;
    if (dias === 1) return t.un_dia;
    return `${dias} ${t.dias}`;
  }

  function labelFecha(fecha) {
    const dias = diasHasta(fecha);
    if (dias < 0)   return t.vencido;
    if (dias === 0) return `⚠ ${t.hoy}`;
    const partes = fecha.split('-');
    const f = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    return f.toLocaleDateString(isPT ? 'pt-BR' : 'es-AR', { day: 'numeric', month: 'short' });
  }

  async function cargar() {
    const sb = getClient();
    // Auto-borrar vencimientos con más de 2 días vencidos
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const limite = new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000);
    const limitStr = limite.toISOString().slice(0,10);
    await sb.from('vencimientos').delete()
      .eq('bar_id', usuario.bar_id)
      .lt('fecha', limitStr);

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
        <div className="text-lg font-bold text-t1">{t.vencimientos}</div>
        {isAdmin && !agregando && (
          <button onClick={() => setAgregando(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">
            + {t.agregar}
          </button>
        )}
      </div>

      {agregando && (
        <div className="bg-surface rounded-2xl shadow-card p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold text-t1">{t.nuevo_vencimiento}</div>
          <input type="text"
            placeholder={isPT ? 'Detalhe (ex: Aluguel, Luz, etc)' : 'Detalle (ej: Alquiler, Luz, etc)'}
            value={form.detalle} onChange={e => setForm({ ...form, detalle: e.target.value })}
            className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm focus:outline-none" />
          <input type="number" placeholder={t.importe}
            value={form.importe} onChange={e => setForm({ ...form, importe: e.target.value })}
            className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm focus:outline-none" />
          <input type="date" value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
            className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-sm focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={() => setAgregando(false)}
              className="flex-1 h-11 rounded-xl border border-divider text-t3 text-sm">{t.cancelar}</button>
            <button onClick={guardar} disabled={guardando}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50">
              {guardando ? '...' : t.guardar}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-t3 text-sm py-8">{t.cargando}</div>
      ) : vencimientos.length === 0 ? (
        <div className="text-center text-t3 text-sm py-8">{t.sin_vencimientos}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {vencimientos.map(v => {
            const s = semaforo(v.fecha);
            return (
              <SwipeToDelete key={v.id} onDelete={() => eliminar(v.id)}>
                <div style={{ backgroundColor: s.bg, borderColor: s.border }}
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
                      <div className="text-sm font-bold text-t1">{fmtL(v.importe)}</div>
                      <div style={{ color: s.label }} className="text-xs font-semibold">{labelDias(v.fecha)}</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => eliminar(v.id)} className="text-t4 text-lg leading-none">×</button>
                    )}
                  </div>
                </div>
              </SwipeToDelete>
            );
          })}
        </div>
      )}
    </div>
  );
}
