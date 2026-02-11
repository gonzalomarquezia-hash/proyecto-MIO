-- ============================================
-- CONCIENCIA - Schema de Base de Datos Supabase
-- Sistema de Acompañamiento Terapéutico Personal
-- ============================================

-- 1. PERFIL DE USUARIO
CREATE TABLE IF NOT EXISTS perfil_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  estatura_cm INTEGER,
  peso_kg DECIMAL,
  foto_url TEXT,
  ambiciones TEXT[] DEFAULT '{}',
  estructura_interna_actual JSONB DEFAULT '{}',
  datos_actualizados_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REGISTROS EMOCIONALES (tabla principal)
CREATE TABLE IF NOT EXISTS registros_emocionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fecha DATE DEFAULT CURRENT_DATE,
  mensaje_raw TEXT NOT NULL,
  estado_emocional TEXT[] DEFAULT '{}',
  intensidad_emocional INTEGER CHECK (intensidad_emocional BETWEEN 0 AND 100),
  voz_identificada TEXT CHECK (voz_identificada IN ('nino', 'sargento', 'adulto', 'mixta', 'ninguna_dominante')),
  pensamiento_automatico TEXT,
  distorsion_cognitiva TEXT[] DEFAULT '{}',
  contexto TEXT,
  pensamiento_alternativo TEXT,
  intensidad_post_reestructuracion INTEGER CHECK (intensidad_post_reestructuracion BETWEEN 0 AND 100),
  actividades_realizadas TEXT[] DEFAULT '{}',
  avances_del_dia TEXT,
  tipo_registro TEXT DEFAULT 'entrada_libre' CHECK (tipo_registro IN ('entrada_libre', 'checkin_habito', 'reflexion_nocturna', 'respuesta_notificacion')),
  respuesta_ia TEXT
);

-- 3. METAS
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT CHECK (categoria IN ('fisico', 'emocional', 'profesional', 'relacional', 'academico', 'personal')),
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'completada', 'abandonada')),
  fecha_limite DATE,
  progreso_porcentaje INTEGER DEFAULT 0 CHECK (progreso_porcentaje BETWEEN 0 AND 100),
  notas_progreso TEXT
);

-- 4. HÁBITOS
CREATE TABLE IF NOT EXISTS habitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
  meta_id UUID REFERENCES metas(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  frecuencia TEXT DEFAULT 'diario',
  hora_recordatorio TIME,
  mensaje_recordatorio TEXT,
  mensaje_nocturno TEXT,
  hora_mensaje_nocturno TIME,
  activo BOOLEAN DEFAULT TRUE,
  racha_actual INTEGER DEFAULT 0,
  racha_maxima INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHECK-INS DE HÁBITOS
CREATE TABLE IF NOT EXISTS checkins_habitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
  habito_id UUID REFERENCES habitos(id) ON DELETE CASCADE,
  fecha DATE DEFAULT CURRENT_DATE,
  hora_programada TIME,
  hora_real TIME,
  completado BOOLEAN DEFAULT FALSE,
  sentimiento_antes TEXT,
  sentimiento_durante TEXT,
  sentimiento_despues TEXT,
  voz_activa_durante TEXT,
  que_hizo_despues TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONFIGURACIÓN DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('recordatorio_habito', 'checkin_emocional', 'cierre_dia', 'personalizado')),
  hora TIME,
  mensaje TEXT,
  dias_semana TEXT[] DEFAULT '{}',
  activa BOOLEAN DEFAULT TRUE,
  tono TEXT DEFAULT 'invitacion' CHECK (tono IN ('invitacion', 'motivacional', 'neutro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_registros_user_id ON registros_emocionales(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_emocionales(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_created ON registros_emocionales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_habitos_user_id ON habitos(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_habito_id ON checkins_habitos(habito_id);
CREATE INDEX IF NOT EXISTS idx_checkins_fecha ON checkins_habitos(fecha);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_emocionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins_habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_config ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para MVP (sin auth por ahora - acceso completo)
-- En producción se restringirá por auth.uid()
CREATE POLICY "Allow all access to perfil_usuario" ON perfil_usuario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to registros_emocionales" ON registros_emocionales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to metas" ON metas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to habitos" ON habitos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to checkins_habitos" ON checkins_habitos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to notificaciones_config" ON notificaciones_config FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Crear perfil de Gonza
-- ============================================
INSERT INTO perfil_usuario (nombre, estatura_cm, ambiciones, estructura_interna_actual)
VALUES (
  'Gonza',
  164,
  ARRAY['Lanzar agencia de automatización', 'Construir físico con buena masa muscular', 'Ser emocionalmente independiente y seguro'],
  '{
    "adulto_responsable": {
      "fisico": "Postura recta, mirada segura, ejercicio diario",
      "autoestima": "Se siente a gusto con su propia compañía, suelta lo que no suma",
      "estado_emocional": "Felicidad con orgullo, calma con el pasado, satisfacción con el presente",
      "accion": "Hace lo que tiene que hacer tenga ganas o no",
      "introspeccion": "La usa como herramienta de mejora, nunca como castigo"
    },
    "voces": {
      "nino": "Voz de victimización, impotencia, busca protección mediante evitación",
      "sargento": "Voz hipercrítica, minimiza logros, se activa después de avances",
      "adulto": "En construcción - validador, realista, compasivo sin lástima"
    }
  }'::jsonb
);
