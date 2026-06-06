// src/lib/constants.js
export const MEDIOS_PAGO = [
  { key: 'efectivo',      label: 'Efectivo',          color: '#2D6B8C', defaultRet: 0  },
  { key: 'tarjeta',       label: 'Tarjeta',            color: '#1A4F6A', defaultRet: 27 },
  { key: 'qr',            label: 'QR / Mercado Pago',  color: '#4A90A4', defaultRet: 2  },
  { key: 'transferencia', label: 'Transferencia',      color: '#6BAFC0', defaultRet: 0  },
  { key: 'delivery',      label: 'Delivery',           color: '#f87171', defaultRet: 25 },
];

export const TIPOS_EGRESO = [
  { key: 'proveedores',  label: 'Proveedores' },
  { key: 'alquiler',     label: 'Alquiler' },
  { key: 'servicios',    label: 'Luz / Gas / Agua' },
  { key: 'sueldos',      label: 'Sueldos' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
  { key: 'retiros',      label: 'Retiros' },
  { key: 'impuestos',    label: 'Impuestos y Tasas' },
  { key: 'otros',        label: 'Otros' },
];

export const MEDIOS_PAGO_EGRESO = [
  { key: 'efectivo',      label: 'Efectivo' },
  { key: 'transferencia', label: 'Transferencia' },
];

export const TURNOS = [
  { key: '1',         label: 'Turno 1',   icon: '☀️' },
  { key: '2',         label: 'Turno 2',   icon: '🌙' },
<div className="text-lg font-bold text-t1">
  {turno === '1' ? 'Apertura de caja' : turno === '2' ? 'Recepción de caja' : 'Apertura de caja'}
</div>
<div className="text-sm text-t3 mt-1 capitalize">
  {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {turno === '1' ? 'Turno 1 ☀️' : turno === '2' ? 'Turno 2 🌙' : 'Turno único ☀️'}
</div>
];

export const CONFIG_KEYS = {
  efectivo:      'retencion_efectivo',
  tarjeta:       'retencion_tarjeta',
  qr:            'retencion_qr',
  transferencia: 'retencion_transferencia',
  pedidosya:     'retencion_pedidosya',
  rappi:         'retencion_rappi',
  delivery:      'retencion_delivery',
};
