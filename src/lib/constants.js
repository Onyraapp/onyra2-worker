// src/lib/constants.js
export const MEDIOS_PAGO = [
  { key: 'efectivo',      label: 'Efectivo',          labelPT: 'Dinheiro',         color: '#0F4C5C', defaultRet: 0  },
  { key: 'tarjeta',       label: 'Tarjeta',            labelPT: 'Cartão',           color: '#1A4F6A', defaultRet: 27 },
  { key: 'qr',            label: 'QR / Mercado Pago',  labelPT: 'QR / Mercado Pago',color: '#4A90A4', defaultRet: 2  },
  { key: 'transferencia', label: 'Transferencia',      labelPT: 'Transferência',    color: '#6BAFC0', defaultRet: 0  },
  { key: 'pix',           label: 'PIX',                labelPT: 'PIX',              color: '#00BDAE', defaultRet: 0  },
  { key: 'delivery',      label: 'Delivery',           labelPT: 'Delivery',         color: '#f87171', defaultRet: 25 },
];
export const TIPOS_EGRESO = [
  { key: 'proveedores',   label: 'Proveedores',      labelPT: 'Fornecedores'      },
  { key: 'alquiler',      label: 'Alquiler',         labelPT: 'Aluguel'           },
  { key: 'servicios',     label: 'Luz / Gas / Agua', labelPT: 'Luz / Gás / Água'  },
  { key: 'sueldos',       label: 'Sueldos',          labelPT: 'Salários'          },
  { key: 'mantenimiento', label: 'Mantenimiento',    labelPT: 'Manutenção'        },
  { key: 'limpieza',      label: 'Limpieza/Papelería',labelPT: 'Limpeza/Papelaria' },
  { key: 'retiros',       label: 'Retiros',          labelPT: 'Retiradas'         },
  { key: 'impuestos',     label: 'Impuestos y Tasas',labelPT: 'Impostos e Taxas'  },
  { key: 'otros',         label: 'Otros',            labelPT: 'Outros'            },
];
export const MEDIOS_PAGO_EGRESO = [
  { key: 'efectivo',      label: 'Efectivo',      labelPT: 'Dinheiro'      },
  { key: 'transferencia', label: 'Transferencia', labelPT: 'Transferência' },
  { key: 'pix',           label: 'PIX',           labelPT: 'PIX'           },
];
export const TURNOS = [
  { key: '1',         label: 'Turno 1',     labelPT: 'Turno 1',    icon: '☀️' },
  { key: '2',         label: 'Turno 2',     labelPT: 'Turno 2',    icon: '🌙' },
  { key: 'sin_turno', label: 'Turno único', labelPT: 'Turno único', icon: '⭐' },
];
export function getLabel(item, isPT) {
  return isPT && item.labelPT ? item.labelPT : item.label;
}

export const CONFIG_KEYS = {
  efectivo:      'retencion_efectivo',
  tarjeta:       'retencion_tarjeta',
  qr:            'retencion_qr',
  transferencia: 'retencion_transferencia',
  pix:           'retencion_pix',
  pedidosya:     'retencion_pedidosya',
  rappi:         'retencion_rappi',
  delivery:      'retencion_delivery',
};
