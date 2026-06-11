// src/components/ui/index.jsx — Apple light theme
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

export function KpiCard({ label, value, sub, color = 'default', className = '', fmtFn }) {
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
        {typeof value === 'number' ? (fmtFn ? fmtFn(value) : fmt(value)) : value}
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
