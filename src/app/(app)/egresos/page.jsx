'use client';
import React, { useState } from 'react';
import { fmt } from '../../lib/data';
export { useState };

export function Screen({ children, className = '' }) {
  return <div className={`flex flex-col gap-3 px-4 py-5 ${className}`}>{children}</div>;
}

export function Card({ children, className = '' }) {
  return <div className={`bg-surface rounded-2xl shadow-card ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-divider">
      <div>
        <div className="text-sm font-semibold text-t1">{title}</div>
        {subtitle && <div className="text-xs text-t3 mt-0.5">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function KpiCard({ label, value, sub, color = 'default', className = '' }) {
  const styles = {
    green:   { wrap: 'bg-greensoft',  val: 'text-greentext' },
    red:     { wrap: 'bg-redsoft',    val: 'text-redtext'   },
    amber:   { wrap: 'bg-ambersoft',  val: 'text-ambertext' },
    default: { wrap: 'bg-surface',    val: 'text-t1'        },
  };
  const s = styles[color] || styles.default;
  return (
    <div className={`flex-1 rounded-2xl p-4 shadow-card ${s.wrap} ${className}`}>
      <div className="text-[11px] font-medium text-t3 mb-1.5 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold tabular-nums tracking-tight ${s.val}`}>
        {typeof value === 'number' ? fmt(value) : value}
      </div>
      {sub && <div className="text-xs text-t3 mt-1">{sub}</div>}
    </div>
  );
}

export function ResultadoCard({ valor, label = 'Resultado' }) {
  const pos = valor >= 0;
  return (
    <div className={`rounded-2xl p-4 shadow-card flex justify-between items-center ${pos ? 'bg-greensoft' : 'bg-redsoft'}`}>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-t3">{label}</div>
        <div className={`text-xs mt-0.5 font-medium ${pos ? 'text-greentext' : 'text-redtext'}`}>
          {pos ? 'Resultado positivo' : 'Resultado negativo'}
        </div>
      </div>
      <span className={`text-3xl font-bold tracking-tight tabular-nums ${pos ? 'text-greentext' : 'text-redtext'}`}>
        {valor < 0 && '−'}{fmt(Math.abs(valor))}
      </span>
    </div>
  );
}

export function BreakdownBar({ label, value, total, color = '#34C759', right }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-t2">{label}</span>
        <span className="text-sm font-semibold text-t1 tabular-nums">{right || fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-t4/40 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function TablaRetencion({ rows }) {
  return (
    <div className="flex flex-col divide-y divide-divider">
      {rows.map((r, i) => (
        <div key={i} className="py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
            <span className="text-sm font-medium text-t1">{r.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pl-4">
            <div>
              <div className="text-[10px] text-t3 uppercase tracking-wide">Bruto</div>
              <div className="text-sm font-semibold text-t1 tabular-nums">{fmt(r.bruto)}</div>
            </div>
            <div>
              <div className="text-[10px] text-t3 uppercase tracking-wide">Retención</div>
              <div className="text-sm font-semibold text-redtext tabular-nums">−{fmt(r.retencion)}</div>
            </div>
            <div>
              <div className="text-[10px] text-t3 uppercase tracking-wide">Neto</div>
              <div className="text-sm font-semibold text-greentext tabular-nums">{fmt(r.neto)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BtnPrimary({ label, onClick, loading, disabled, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`w-full h-12 rounded-xl bg-green font-semibold text-white text-[15px] active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm ${className}`}>
      {loading ? '...' : label}
    </button>
  );
}

export function BtnSecondary({ label, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`w-full h-11 rounded-xl bg-surface shadow-card border border-border font-medium text-t1 text-sm active:scale-[0.98] transition-all ${className}`}>
      {label}
    </button>
  );
}

export function BtnDanger({ label, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`w-full h-11 rounded-xl bg-redsoft border border-red/20 font-medium text-redtext text-sm active:scale-[0.98] transition-all ${className}`}>
      {label}
    </button>
  );
}

export function FieldLabel({ children }) {
  return <div className="text-[11px] font-medium text-t3 mb-1.5 uppercase tracking-wide">{children}</div>;
}

export function Input({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full bg-offset rounded-xl px-4 py-3 text-t1 text-[15px] border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4 transition ${className}`} />
  );
}

export function MontoInput({ value, onChange, color }) {
  return (
    <div className="flex items-center bg-offset rounded-xl px-4 border border-transparent focus-within:border-primary/40 transition">
      <span className="text-2xl font-light text-t3 mr-1">$</span>
      <input type="number" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder="0"
        className={`flex-1 bg-transparent py-4 text-3xl font-bold tracking-tight placeholder:text-t4 focus:outline-none tabular-nums ${color || 'text-t1'}`} />
    </div>
  );
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-offset rounded-xl px-4 py-3 text-t1 text-[15px] border border-transparent focus:outline-none focus:border-primary/40 transition ${className}`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full bg-offset rounded-xl px-4 py-3 text-t1 text-[15px] border border-transparent focus:outline-none focus:border-primary/40 placeholder:text-t4 transition resize-none" />
  );
}

export function ChipGroup({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(o => {
        const sel = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${sel ? 'bg-primary text-white shadow-sm' : 'bg-offset text-t2'}`}
            style={sel && o.color ? { backgroundColor: o.color } : {}}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({ label, variant = 'primary' }) {
const styles = {
    primary: 'bg-white/20 text-white',
    success: 'bg-white/20 text-white',
    danger:  'bg-redsoft text-redtext',
    warning: 'bg-ambersoft text-ambertext',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${styles[variant]}`}>{label}</span>;
}

export function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center py-10 gap-2">
      <span className="text-4xl">📭</span>
      <span className="text-sm text-t3 text-center">{message}</span>
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex justify-center py-8">
      <div className={`${sz} border-2 border-t4 border-t-primary rounded-full animate-spin`} />
    </div>
  );
}

export function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t4 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export function Toast({ msg, visible }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-t1 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      {msg}
    </div>
  );
}

export function useToast() {
  const [toast,   setToast]   = React.useState('');
  const [visible, setVisible] = React.useState(false);
  function show(msg) {
    setToast(msg); setVisible(true);
    setTimeout(() => setVisible(false), 2500);
    setTimeout(() => setToast(''), 3000);
  }
  return { toast, visible, show };
}

export function DivRow({ label, value, valueClass = 'text-t1', bold = false }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-divider last:border-0">
      <span className="text-sm text-t2">{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-semibold' : 'font-medium'} ${valueClass}`}>{value}</span>
    </div>
  );
}
kurkellusa@MacBook-Air-de-Kurke onyra2-worker % >....                                                                   
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-t1 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      {msg}
    </div>
  );
}

export function useToast() {
  const [toast,   setToast]   = React.useState('');
  const [visible, setVisible] = React.useState(false);
  function show(msg) {
    setToast(msg); setVisible(true);
    setTimeout(() => setVisible(false), 2500);
    setTimeout(() => setToast(''), 3000);
  }
  return { toast, visible, show };
}

export function DivRow({ label, value, valueClass = 'text-t1', bold = false }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-divider last:border-0">
      <span className="text-sm text-t2">{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-semibold' : 'font-medium'} ${valueClass}`}>{value}</span>
    </div>
  );
}
kurkellusa@MacBook-Air-de-Kurke onyra2-worker % cp ~/Downloads/egresos_page.jsx ~/Downloads/onyra2-worker/src/app/\(app\)/egresos/page.jsx
zsh: parse error near `}'
kurkellusa@MacBook-Air-de-Kurke onyra2-worker % cp ~/Downloads/egresos_page.jsx src/app/\(app\)/egresos/page.jsx
kurkellusa@MacBook-Air-de-Kurke onyra2-worker % cat "src/app/(app)/egresos/page.jsx"
// src/app/(app)/egresos/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { crearEgreso, getConfiguracion, getEgresosDia, fmt, todayStr, getTurnosCerradosHoy } from '../../../lib/data';
import { TIPOS_EGRESO, TURNOS, MEDIOS_PAGO_EGRESO } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  FieldLabel, BtnPrimary, Toast, useToast, Textarea
} from '../../../components/ui';
import { getClient } from '../../../lib/supabase';
import { useLocale } from '../../../hooks/useLocale';

export default function EgresosPage() {
  const { usuario } = useAuth();
  const { toast, visible, show } = useToast();
  const { t, isPT, fmt: fmtL } = useLocale();
  const symbol = isPT ? 'R$' : '$';

  const [config,    setConfig]    = useState(null);
  const [tipo,      setTipo]      = useState('proveedores');
  const [turno,     setTurno]     = useState('sin_turno');
  const [medioPago, setMedioPago] = useState('efectivo');
  const [monto,     setMonto]     = useState('');
  const [detalle,   setDetalle]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [egresos,   setEgresos]   = useState([]);
  const [editando,  setEditando]  = useState(null);
  const [editMonto,   setEditMonto]   = useState('');
  const [editDetalle, setEditDetalle] = useState('');
  const [editTipo,    setEditTipo]    = useState('');
  const [editMedio,   setEditMedio]   = useState('');

  useEffect(() => {
    if (!usuario) return;
    getConfiguracion(usuario.bar_id).then(setConfig).catch(() => {});
    cargarEgresos();
    getTurnosCerradosHoy(usuario.bar_id).then(cerrados => {
      if (cerrados.includes('1') && cerrados.includes('2')) setTurno('sin_turno');
      else if (cerrados.includes('1')) setTurno('2');
      else setTurno('1');
    }).catch(() => {});
  }, [usuario]);

  async function cargarEgresos() {
    if (!usuario) return;
    try {
      const data = await getEgresosDia(usuario.bar_id, todayStr());
      setEgresos(data);
    } catch {}
  }

  async function guardar() {
    const m = parseFloat(monto);
    if (!m || m <= 0) return show('⚠ ' + (isPT ? 'Informe um valor válido' : 'Ingresá un monto válido'));
    setLoading(true);
    try {
      await crearEgreso({
        barId: usuario.bar_id, turnoId: null, usuarioId: usuario.id,
        tipo, monto: m, detalle, medio_pago: medioPago,
      });
      setMonto(''); setDetalle('');
      show('✓ ' + (isPT ? 'Gasto registrado' : 'Gasto registrado'));
      cargarEgresos();
      if (config?.wa_alerta_gasto && config?.whatsapp_numero) {
        const montoMinimo = config?.wa_alerta_gasto_monto || 10000;
        if (m >= montoMinimo) {
          const tipoLabel = TIPOS_EGRESO.find(tp => tp.key === tipo)?.label || tipo;
          const medioLabel = MEDIOS_PAGO_EGRESO.find(tp => tp.key === medioPago)?.label || medioPago;
          const msg = [
            `*Troco - ${isPT ? 'Alerta de gasto' : 'Alerta de gasto'}*`, ``,
            `${isPT ? 'Foi registrado um gasto de' : 'Se registró un gasto de'} *${fmtL(m)}*`,
            `${isPT ? 'Tipo' : 'Tipo'}: ${tipoLabel}`,
            `${isPT ? 'Forma de pagamento' : 'Medio de pago'}: ${medioLabel}`,
            detalle ? `${isPT ? 'Detalhe' : 'Detalle'}: ${detalle}` : '',
          ].filter(Boolean).join('\n');
          window.open(`https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }
    } catch {
      show('✗ ' + t.error);
    } finally {
      setLoading(false);
    }
  }

  function abrirEditar(e) {
    setEditando(e);
    setEditMonto(String(e.monto));
    setEditDetalle(e.detalle || '');
    setEditTipo(e.tipo);
    setEditMedio(e.medio_pago || 'efectivo');
  }

  async function guardarEdicion() {
    const m = parseFloat(editMonto);
    if (!m || m <= 0) return show('⚠ ' + (isPT ? 'Informe um valor válido' : 'Ingresá un monto válido'));
    try {
      const sb = getClient();
      await sb.from('egresos').update({
        monto: m, detalle: editDetalle, tipo: editTipo, medio_pago: editMedio,
      }).eq('id', editando.id);
      setEditando(null);
      show('✓ ' + (isPT ? 'Gasto atualizado' : 'Gasto actualizado'));
      cargarEgresos();
    } catch {
      show('✗ ' + t.error);
    }
  }

  async function eliminar(id) {
    if (!confirm(isPT ? 'Excluir este gasto?' : '¿Eliminar este gasto?')) return;
    try {
      const sb = getClient();
      await sb.from('egresos').delete().eq('id', id);
      show('✓ ' + (isPT ? 'Gasto excluído' : 'Gasto eliminado'));
      cargarEgresos();
    } catch {
      show('✗ ' + t.error);
    }
  }

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      {editando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-24 px-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl">
            <div className="text-base font-bold text-t1">{isPT ? 'Editar gasto' : 'Editar gasto'}</div>
            <div>
              <FieldLabel>{t.tipo_gasto}</FieldLabel>
              <ChipGroup
                options={TIPOS_EGRESO.map(tp => ({ value: tp.key, label: tp.label }))}
                value={editTipo}
                onChange={setEditTipo}
                className="grid grid-cols-3"
              />
            </div>
            <div>
              <FieldLabel>{t.medio_pago_egreso}</FieldLabel>
              <ChipGroup options={MEDIOS_PAGO_EGRESO.map(tp => ({ value: tp.key, label: tp.label }))} value={editMedio} onChange={setEditMedio} />
            </div>
            <div>
              <FieldLabel>{t.importe}</FieldLabel>
              <MontoInput value={editMonto} onChange={setEditMonto} color="text-ambertext" symbol={symbol} />
            </div>
            <div>
              <FieldLabel>{t.detalle}</FieldLabel>
              <Textarea value={editDetalle} onChange={setEditDetalle} placeholder={isPT ? 'Detalhe do gasto...' : 'Detalle del gasto...'} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditando(null)} className="flex-1 h-11 rounded-xl bg-offset text-t2 text-sm font-medium">{t.cancelar}</button>
              <button onClick={guardarEdicion} className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold">{t.guardar}</button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader title={isPT ? 'Registrar gasto' : 'Registrar gasto'} />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>{t.tipo_gasto}</FieldLabel>
            <ChipGroup
              options={TIPOS_EGRESO.map(tp => ({ value: tp.key, label: tp.label }))}
              value={tipo}
              onChange={setTipo}
              className="grid grid-cols-3"
            />
          </div>
          <div>
            <FieldLabel>{t.medio_pago_egreso}</FieldLabel>
            <ChipGroup options={MEDIOS_PAGO_EGRESO.map(tp => ({ value: tp.key, label: tp.label }))} value={medioPago} onChange={setMedioPago} />
          </div>
          <div>
            <FieldLabel>{t.turno}</FieldLabel>
            <ChipGroup options={TURNOS.map(tp => ({ value: tp.key, label: `${tp.icon} ${tp.label}` }))} value={turno} onChange={setTurno} />
          </div>
          <div>
            <FieldLabel>{t.importe}</FieldLabel>
            <MontoInput value={monto} onChange={setMonto} color="text-ambertext" symbol={symbol} />
          </div>
          <div>
            <FieldLabel>{t.detalle_opcional}</FieldLabel>
            <Textarea value={detalle} onChange={setDetalle} placeholder={isPT ? 'Ex: Pagamento fornecedor, conta de luz...' : 'Ej: Pago cervezas Quilmes, factura luz mayo...'} />
          </div>
          <BtnPrimary label={isPT ? 'Registrar gasto' : 'Registrar gasto'} onClick={guardar} loading={loading} className="bg-amber" />
        </div>
      </Card>

      {egresos.length > 0 && (
        <Card>
          <CardHeader
            title={isPT ? 'Gastos de hoje' : 'Gastos de hoy'}
            subtitle={`${egresos.length} · ${fmtL(egresos.reduce((s, e) => s + e.monto, 0))}`}
          />
          <div className="p-4 flex flex-col gap-2">
            {egresos.map(e => {
              const tp = TIPOS_EGRESO.find(te => te.key === e.tipo);
              return (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                  <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0 bg-amber" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-t1">{tp?.label || e.tipo}</div>
                    {e.detalle && <div className="text-xs text-t3 mt-0.5 truncate">{e.detalle}</div>}
                    <div className="text-xs text-t3 mt-0.5">{e.fecha?.slice(11,16)}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-ambertext flex-shrink-0">
                    {fmtL(e.monto)}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => abrirEditar(e)}
                      className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">
                      ✏️
                    </button>
                    <button onClick={() => eliminar(e.id)}
                      className="w-8 h-8 rounded-lg bg-redsoft flex items-center justify-center text-redtext text-sm">
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </Screen>
  );
}
