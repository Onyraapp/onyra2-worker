// src/app/(app)/egresos/page.jsx
'use client';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { crearEgreso, fmt } from '../../../lib/data';
import { TIPOS_EGRESO, TURNOS } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  FieldLabel, BtnPrimary, Toast, useToast, Textarea
} from '../../../components/ui';

export default function EgresosPage() {
  const { usuario } = useAuth();
  const { toast, visible, show } = useToast();

  const [tipo,    setTipo]    = useState('proveedores');
  const [turno,   setTurno]   = useState('sin_turno');
  const [monto,   setMonto]   = useState('');
  const [detalle, setDetalle] = useState('');
  const [loading, setLoading] = useState(false);

  async function guardar() {
    const m = parseFloat(monto);
    if (!m || m <= 0) return show('⚠ Ingresá un monto válido');
    setLoading(true);
    try {
      await crearEgreso({
        barId:     usuario.bar_id,
        turnoId:   null,
        usuarioId: usuario.id,
        tipo, monto: m, detalle,
      });
      setMonto(''); setDetalle('');
      show('✓ Gasto registrado');
    } catch {
      show('✗ Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Toast msg={toast} visible={visible} />

      <Card>
        <CardHeader title="Registrar gasto" />
        <div className="p-4 flex flex-col gap-4">

          <div>
            <FieldLabel>Tipo de gasto</FieldLabel>
            <ChipGroup
              options={TIPOS_EGRESO.map(t => ({ value: t.key, label: t.label }))}
              value={tipo}
              onChange={setTipo}
            />
          </div>

          <div>
            <FieldLabel>Turno</FieldLabel>
            <ChipGroup
              options={TURNOS.map(t => ({ value: t.key, label: `${t.icon} ${t.label}` }))}
              value={turno}
              onChange={setTurno}
            />
          </div>

          <div>
            <FieldLabel>Monto</FieldLabel>
            <MontoInput value={monto} onChange={setMonto} color="text-ambertext" />
          </div>

          <div>
            <FieldLabel>Detalle (opcional)</FieldLabel>
            <Textarea
              value={detalle}
              onChange={setDetalle}
              placeholder="Ej: Pago cervezas Quilmes, factura luz mayo..."
            />
          </div>

          <BtnPrimary
            label="Registrar gasto"
            onClick={guardar}
            loading={loading}
            className="bg-amber"
          />
        </div>
      </Card>
    </Screen>
  );
}
