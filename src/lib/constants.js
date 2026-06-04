// src/lib/constants.js
export const MEDIOS_PAGO = [
  { key: 'efectivo',      label: 'Efectivo',          color: '#2D6B8C', defaultRet: 0  },
  { key: 'tarjeta',       label: 'Tarjeta',            color: '#1A4F6A', defaultRet: 27 },
  { key: 'qr',            label: 'QR / Mercado Pago',  color: '#4A90A4', defaultRet: 2  },
  { key: 'transferencia', label: 'Transferencia',      color: '#6BAFC0', defaultRet: 0  },
  { key: 'pedidosya',     label: 'Delivery PedidosYa', color: '#f87171', defaultRet: 30 },
  { key: 'rappi',         label: 'Delivery Rappi',     color: '#fb923c', defaultRet: 25 },
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
  { key: 'sin_turno', label: 'Sin turno', icon: '—'  },
];

export const CONFIG_KEYS = {
  efectivo:      'retencion_efectivo',
  tarjeta:       'retencion_tarjeta',
  qr:            'retencion_qr',
  transferencia: 'retencion_transferencia',
  pedidosya:     'retencion_pedidosya',
  rappi:         'retencion_rappi',
};
