// src/lib/exportar.js
import { utils, write } from 'xlsx';
import { fmt } from './data';
import { MEDIOS_PAGO, TIPOS_EGRESO } from './constants';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportarMesExcel(resumen, año, mes, mesLabel) {
  const wb = utils.book_new();

  // Hoja 1: Resumen
  const resData = [
    ['CajaBar — Resumen mensual', mesLabel],
    [],
    ['Concepto', 'Monto'],
    ['Ventas brutas',  resumen.totalBruto],
    ['Retenciones',   -resumen.totalRetencion],
    ['Ventas netas',   resumen.totalNeto],
    ['Gastos',        -resumen.totalEgresos],
    ['Resultado',      resumen.resultado],
    [],
    ['Rentabilidad', resumen.totalBruto > 0
      ? ((resumen.resultado / resumen.totalBruto) * 100).toFixed(1) + '%'
      : '0%'],
    [],
    ['VENTAS POR MEDIO DE PAGO'],
    ['Medio', 'Bruto', 'Retención', 'Neto'],
    ...MEDIOS_PAGO
      .filter(m => resumen.porMedio[m.key])
      .map(m => [
        m.label,
        resumen.porMedio[m.key].bruto,
        -resumen.porMedio[m.key].retencion,
        resumen.porMedio[m.key].neto,
      ]),
  ];

  const wsRes = utils.aoa_to_sheet(resData);
  wsRes['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  utils.book_append_sheet(wb, wsRes, 'Resumen');

  const buf = write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `CajaBar_${año}-${String(mes).padStart(2,'0')}.xlsx`
  );
}

export async function exportarMesPDF(resumen, año, mes, mesLabel, nombreBar = 'CajaBar') {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(18, 26, 47);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(245, 247, 251);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CajaBar', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(nombreBar, margin, 26);
  doc.text(`Resumen ${mesLabel}`, 210 - margin, 26, { align: 'right' });

  y = 45;
  doc.setTextColor(30, 30, 30);

  // Resumen general
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del mes', margin, y); y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Monto']],
    body: [
      ['Ventas brutas',   fmt(resumen.totalBruto)],
      ['Retenciones',    `−${fmt(resumen.totalRetencion)}`],
      ['Ventas netas',    fmt(resumen.totalNeto)],
      ['Gastos',         `−${fmt(resumen.totalEgresos)}`],
      ['Resultado neto',  fmt(resumen.resultado)],
      ['Rentabilidad',    resumen.totalBruto > 0
        ? ((resumen.resultado / resumen.totalBruto)*100).toFixed(1) + '%'
        : '0%'],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [18, 26, 47], textColor: [245, 247, 251] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Por medio de pago
  const medioRows = MEDIOS_PAGO
    .filter(m => resumen.porMedio[m.key])
    .map(m => [
      m.label,
      fmt(resumen.porMedio[m.key].bruto),
      `−${fmt(resumen.porMedio[m.key].retencion)} (${resumen.porMedio[m.key].retencion > 0
        ? ((resumen.porMedio[m.key].retencion / resumen.porMedio[m.key].bruto)*100).toFixed(1)+'%'
        : '0%'})`,
      fmt(resumen.porMedio[m.key].neto),
    ]);

  if (medioRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Por medio de pago', margin, y); y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Medio', 'Bruto', 'Retención', 'Neto']],
      body: medioRows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [18, 26, 47], textColor: [245, 247, 251] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CajaBar · ${nombreBar} · ${mesLabel} · Pág. ${i}/${pageCount}`,
      105, 290, { align: 'center' });
  }

  doc.save(`CajaBar_${año}-${String(mes).padStart(2,'0')}.pdf`);
}

export function compartirWhatsApp(resumen, mesLabel, nombreBar = '') {
  const pos = resumen.resultado >= 0;
  const msg = [
    `🧾 *CajaBar${nombreBar ? ' — ' + nombreBar : ''}*`,
    `📅 ${mesLabel}`,
    ``,
    `📈 Ventas brutas:  ${fmt(resumen.totalBruto)}`,
    `📉 Retenciones:    −${fmt(resumen.totalRetencion)}`,
    `💰 Ventas netas:   ${fmt(resumen.totalNeto)}`,
    `🔴 Gastos:         −${fmt(resumen.totalEgresos)}`,
    ``,
    `${pos ? '✅' : '❌'} Resultado: *${fmt(resumen.resultado)}*`,
  ].join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
