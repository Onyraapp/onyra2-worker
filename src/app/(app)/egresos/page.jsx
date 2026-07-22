// src/app/(app)/egresos/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { crearEgreso, getConfiguracion, getEgresosDia, fmt, todayStr, getTurnoAbiertoGlobal } from '../../../lib/data';
import { TIPOS_EGRESO, MEDIOS_PAGO_EGRESO, getLabel } from '../../../lib/constants';
import {
  Screen, Card, CardHeader, MontoInput, ChipGroup,
  FieldLabel, BtnPrimary, Toast, useToast, Textarea
} from '../../../components/ui';
import { getClient } from '../../../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { useLocale } from '../../../hooks/useLocale';

export default function EgresosPage() {
  const { usuario } = useAuth();
  const { toast, visible, show } = useToast();
  const { t, isPT, fmt: fmtL } = useLocale();
  const symbol = isPT ? 'R$' : '$';

  const [config,    setConfig]    = useState(null);
  const [turnoAbierto, setTurnoAbierto] = useState(undefined); // undefined = todavía no chequeado
  const [tipo,      setTipo]      = useState('proveedores');
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
    const chequearTurno = () => {
      getTurnoAbiertoGlobal(usuario.bar_id)
        .then(t => setTurnoAbierto(t && !t.cerrado ? t : null))
        .catch(() => setTurnoAbierto(null));
    };
    chequearTurno();
    window.addEventListener('focus', chequearTurno);
    return () => window.removeEventListener('focus', chequearTurno);
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
        barId: usuario.bar_id, turnoId: turnoAbierto ? turnoAbierto.id : null, usuarioId: usuario.id,
        tipo, monto: m, detalle, medio_pago: medioPago,
      });
      setMonto(''); setDetalle('');
      show('✓ ' + t.gasto_registrado);
      cargarEgresos();
      if (config?.wa_alerta_gasto && config?.whatsapp_numero) {
        const montoMinimo = config?.wa_alerta_gasto_monto || 10000;
        if (m >= montoMinimo) {
          const tipoLabel = TIPOS_EGRESO.find(tp => tp.key === tipo)?.label || tipo;
          const medioLabel = MEDIOS_PAGO_EGRESO.find(tp => tp.key === medioPago)?.label || medioPago;
          const msg = [
            '*Troco - Alerta de gasto*', '',
            'Se registró un gasto de *' + fmtL(m) + '*',
            'Tipo: ' + tipoLabel,
            'Medio de pago: ' + medioLabel,
            detalle ? 'Detalle: ' + detalle : '',
          ].filter(Boolean).join('\n');
          window.open('https://wa.me/' + config.whatsapp_numero + '?text=' + encodeURIComponent(msg), '_blank');
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
      show('✓ ' + t.gasto_actualizado);
      cargarEgresos();
    } catch {
      show('✗ ' + t.error);
    }
  }

  async function eliminar(id) {
    if (!confirm(t.eliminar_gasto)) return;
    try {
      const sb = getClient();
      await sb.from('egresos').delete().eq('id', id);
      show('✓ ' + t.gasto_eliminado);
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
            <div className="text-base font-bold text-t1">{t.editar_gasto}</div>
            <div>
              <FieldLabel>{t.tipo_gasto}</FieldLabel>
              <ChipGroup
                options={TIPOS_EGRESO.map(tp => ({ value: tp.key, label: getLabel(tp, isPT) }))}
                value={editTipo}
                onChange={setEditTipo}
                className="grid grid-cols-3"
              />
            </div>
            <div>
              <FieldLabel>{t.medio_pago_egreso}</FieldLabel>
              <ChipGroup options={MEDIOS_PAGO_EGRESO.map(tp => ({ value: tp.key, label: getLabel(tp, isPT) }))} value={editMedio} onChange={setEditMedio} />
            </div>
            <div>
              <FieldLabel>{t.importe}</FieldLabel>
              <MontoInput value={editMonto} onChange={setEditMonto} color="text-ambertext" symbol={symbol} />
            </div>
            <div>
              <FieldLabel>{t.detalle}</FieldLabel>
              <Textarea value={editDetalle} onChange={setEditDetalle} placeholder={t.detalle_opcional} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditando(null)} className="flex-1 h-11 rounded-xl bg-offset text-t2 text-sm font-medium">{t.cancelar}</button>
              <button onClick={guardarEdicion} className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold">{t.guardar}</button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader title={t.registrar_gasto} />
        <div className="p-4 flex flex-col gap-4">
          <div>
            <FieldLabel>{t.tipo_gasto}</FieldLabel>
            <ChipGroup
              options={TIPOS_EGRESO.map(tp => ({ value: tp.key, label: getLabel(tp, isPT) }))}
              value={tipo}
              onChange={setTipo}
              className="grid grid-cols-3"
            />
          </div>
          <div>
            <FieldLabel>{t.medio_pago_egreso}</FieldLabel>
            <ChipGroup options={MEDIOS_PAGO_EGRESO.map(tp => ({ value: tp.key, label: getLabel(tp, isPT) }))} value={medioPago} onChange={setMedioPago} />
          </div>
          <div>
            <FieldLabel>{t.importe}</FieldLabel>
            <MontoInput value={monto} onChange={setMonto} color="text-ambertext" symbol={symbol} />
          </div>
          <div>
            <FieldLabel>{t.detalle_opcional}</FieldLabel>
            <Textarea value={detalle} onChange={setDetalle} placeholder={t.detalle_opcional} />
          </div>
          <BtnPrimary label={t.registrar_gasto} onClick={guardar} loading={loading} className="bg-amber" />
        </div>
      </Card>

      {egresos.length > 0 && (
        <Card>
          <CardHeader
            title={t.gastos_hoy}
            subtitle={egresos.length + ' · ' + fmtL(egresos.reduce((s, e) => s + e.monto, 0))}
          />
          <div className="p-4 flex flex-col gap-2">
            {egresos.map(e => {
              const tp = TIPOS_EGRESO.find(te => te.key === e.tipo);
              return (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-offset border border-divider">
                  <div className="w-1 h-10 rounded-full mt-0.5 flex-shrink-0 bg-amber" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-t1">{tp ? getLabel(tp, isPT) : e.tipo}</div>
                    {e.detalle && <div className="text-xs text-t3 mt-0.5 truncate">{e.detalle}</div>}
                    <div className="text-xs text-t3 mt-0.5">{e.fecha ? formatInTimeZone(new Date(e.fecha), 'America/Argentina/Buenos_Aires', 'HH:mm') : ''}</div>
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
