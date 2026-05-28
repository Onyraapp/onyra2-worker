// src/app/(app)/mensual/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import { getResumenMes, fmt } from '../../../lib/data';
import { MEDIOS_PAGO } from '../../../lib/constants';
import { exportarMesExcel, exportarMesPDF } from '../../../lib/exportar';
import {
  Screen, Card, CardHeader, KpiCard, ResultadoCard,
  TablaRetencion, Spinner, BtnSecondary, Select
} from '../../../components/ui';

export default function MensualPage() {
  const { usuario } = useAuth();
  const now = new Date();

  // Generar opciones de meses (últimos 12)
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: format(d, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase()),
      año:   d.getFullYear(),
      mes:   d.getMonth() + 1,
      esActual: i === 0,
    };
  });

  const [seleccion, setSeleccion] = useState(meses[1].value); // mes anterior por defecto
  const [resumen,   setResumen]   = useState(null);
  const [loading,   setLoading]   = useState(false);

  const mesObj = meses.find(m => m.value === seleccion);

  useEffect(() => {
    if (!usuario || !mesObj) return;
    setLoading(true);
    setResumen(null);
    getResumenMes(usuario.bar_id, mesObj.año, mesObj.mes)
      .then(setResumen)
      .finally(() => setLoading(false));
  }, [usuario, seleccion]);

  const mesLabel = mesObj ? format(new Date(mesObj.año, mesObj.mes-1, 1), 'MMMM yyyy', { locale: es }) : '';

  const retRows = resumen
    ? MEDIOS_PAGO.filter(m => resumen.porMedio[m.key]).map(m => ({
        label: m.label, color: m.color,
        bruto:     resumen.porMedio[m.key].bruto,
        retencion: resumen.porMedio[m.key].retencion,
        neto:      resumen.porMedio[m.key].neto,
      }))
    : [];

  const rentabilidad = resumen && resumen.totalBruto > 0
    ? ((resumen.resultado / resumen.totalBruto) * 100).toFixed(1)
    : '0.0';

  return (
    <Screen>
      {/* Selector de mes */}
      <Card>
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-t3 mb-1.5">
            Seleccioná el mes
          </div>
          <Select
            value={seleccion}
            onChange={setSeleccion}
            options={meses.filter(m => !m.esActual).map(m => ({ value: m.value, label: m.label }))}
          />
          <p className="text-xs text-t3 mt-2">
            El mes actual se ve en la pantalla Resumen con detalle por día.
          </p>
        </div>
      </Card>

      {loading ? <Spinner /> : resumen && (<>

        <div className="text-center">
          <div className="text-lg font-black text-t1 capitalize">{mesLabel}</div>
          <div className="text-sm text-t3">Rentabilidad: <span className="text-greentext font-bold">{rentabilidad}%</span></div>
        </div>

        {/* KPIs */}
        <div className="flex gap-3">
          <KpiCard label="Ventas brutas" value={resumen.totalBruto} color="green" />
          <KpiCard label="Retenciones"   value={resumen.totalRetencion} color="red" />
        </div>
        <div className="flex gap-3">
          <KpiCard label="Ventas netas" value={resumen.totalNeto} />
          <KpiCard label="Gastos"       value={resumen.totalEgresos} color="amber" />
        </div>

        <ResultadoCard valor={resumen.resultado} label="Resultado del mes" />

        {/* Desglose por medio */}
        {retRows.length > 0 && (
          <Card>
            <CardHeader title="Por medio de pago" />
            <div className="p-4">
              <TablaRetencion rows={retRows} />
            </div>
          </Card>
        )}

        {/* Exportar */}
        <Card>
          <CardHeader title="Exportar" />
          <div className="p-4 flex flex-col gap-2">
            <BtnSecondary
              label="📊  Exportar a Excel"
              onClick={() => exportarMesExcel(resumen, mesObj.año, mesObj.mes, mesLabel)}
            />
            <BtnSecondary
              label="📄  Exportar a PDF"
              onClick={() => exportarMesPDF(resumen, mesObj.año, mesObj.mes, mesLabel, usuario?.bares?.nombre)}
            />
          </div>
        </Card>

      </>)}
    </Screen>
  );
}
