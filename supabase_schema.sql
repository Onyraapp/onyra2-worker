-- ═══════════════════════════════════════════════════════════
-- Troco v2 — Schema multi-tenant con Row Level Security
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── EXTENSIONES ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── BARES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bares (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── USUARIOS ─────────────────────────────────────────────
-- Extiende auth.users de Supabase
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bar_id      UUID NOT NULL REFERENCES bares(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  email       TEXT NOT NULL,
  rol         TEXT NOT NULL CHECK (rol IN ('admin', 'cajero')),
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONFIGURACION ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id                UUID NOT NULL UNIQUE REFERENCES bares(id) ON DELETE CASCADE,
  -- Retenciones (porcentaje, ej: 27 = 27%)
  retencion_efectivo    NUMERIC(5,2) DEFAULT 0,
  retencion_tarjeta     NUMERIC(5,2) DEFAULT 27,
  retencion_qr          NUMERIC(5,2) DEFAULT 2,
  retencion_transferencia NUMERIC(5,2) DEFAULT 0,
  retencion_pedidosya   NUMERIC(5,2) DEFAULT 30,
  retencion_rappi       NUMERIC(5,2) DEFAULT 25,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── TURNOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id        UUID NOT NULL REFERENCES bares(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES usuarios(id),
  numero        TEXT NOT NULL CHECK (numero IN ('1', '2', 'sin_turno')),
  fecha         DATE NOT NULL,
  cerrado       BOOLEAN DEFAULT FALSE,
  cerrado_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── INGRESOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingresos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id          UUID NOT NULL REFERENCES bares(id) ON DELETE CASCADE,
  turno_id        UUID REFERENCES turnos(id),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  medio_pago      TEXT NOT NULL CHECK (medio_pago IN ('efectivo','tarjeta','qr','transferencia','pedidosya','rappi')),
  monto_bruto     NUMERIC(12,2) NOT NULL CHECK (monto_bruto > 0),
  retencion_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  retencion_monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_neto      NUMERIC(12,2) NOT NULL,
  nota            TEXT DEFAULT '',
  -- pendiente = guardado offline, no confirmado aún
  pendiente       BOOLEAN DEFAULT FALSE
);

-- ── EGRESOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS egresos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id        UUID NOT NULL REFERENCES bares(id) ON DELETE CASCADE,
  turno_id      UUID REFERENCES turnos(id),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id),
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo          TEXT NOT NULL CHECK (tipo IN ('proveedores','alquiler','servicios','sueldos','comision_delivery','otros')),
  monto         NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  detalle       TEXT DEFAULT '',
  pendiente     BOOLEAN DEFAULT FALSE
);

-- ── ÍNDICES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ingresos_bar_fecha    ON ingresos (bar_id, fecha);
CREATE INDEX IF NOT EXISTS idx_egresos_bar_fecha     ON egresos  (bar_id, fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_bar_fecha      ON turnos   (bar_id, fecha);
CREATE INDEX IF NOT EXISTS idx_usuarios_bar          ON usuarios (bar_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE bares          ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos        ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener bar_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_bar_id()
RETURNS UUID AS $$
  SELECT bar_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función helper: obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION get_rol()
RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Policies: cada usuario solo ve datos de su bar
CREATE POLICY "bar_own" ON bares
  FOR ALL USING (id = get_bar_id());

CREATE POLICY "usuarios_own" ON usuarios
  FOR ALL USING (bar_id = get_bar_id());

CREATE POLICY "config_own" ON configuracion
  FOR ALL USING (bar_id = get_bar_id());

CREATE POLICY "turnos_own" ON turnos
  FOR ALL USING (bar_id = get_bar_id());

CREATE POLICY "ingresos_own" ON ingresos
  FOR ALL USING (bar_id = get_bar_id());

CREATE POLICY "egresos_own" ON egresos
  FOR ALL USING (bar_id = get_bar_id());

-- Solo admin puede modificar configuracion y usuarios
CREATE POLICY "config_admin_write" ON configuracion
  FOR INSERT WITH CHECK (bar_id = get_bar_id() AND get_rol() = 'admin');

-- ── TRIGGER: crear configuración por defecto al registrar bar ──
CREATE OR REPLACE FUNCTION crear_config_default()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO configuracion (bar_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_bar_insert
  AFTER INSERT ON bares
  FOR EACH ROW EXECUTE FUNCTION crear_config_default();
