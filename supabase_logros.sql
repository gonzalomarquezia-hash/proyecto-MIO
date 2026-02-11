-- ============================================
-- LOGROS: Sistema de micro-logros y evidencia
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de logros
CREATE TABLE IF NOT EXISTS logros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES perfiles(id),
  descripcion text NOT NULL,
  categoria text DEFAULT 'general',
  fuente text DEFAULT 'implicito',
  mensaje_origen text,
  created_at timestamptz DEFAULT now()
);

-- 2. Columnas nuevas en registros_emocionales
ALTER TABLE registros_emocionales ADD COLUMN IF NOT EXISTS logro_detectado text;
ALTER TABLE registros_emocionales ADD COLUMN IF NOT EXISTS estado_animo int;
ALTER TABLE registros_emocionales ADD COLUMN IF NOT EXISTS sintomas_fisicos text[];

-- 3. RLS permisivo para logros (como las otras tablas)
ALTER TABLE logros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logros_all" ON logros FOR ALL USING (true) WITH CHECK (true);

-- 4. Función para buscar logros recientes
CREATE OR REPLACE FUNCTION buscar_logros_recientes(
  user_uuid uuid,
  dias int DEFAULT 7
)
RETURNS TABLE (
  id uuid,
  descripcion text,
  categoria text,
  created_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.descripcion, l.categoria, l.created_at
  FROM logros l
  WHERE l.user_id = user_uuid
    AND l.created_at >= now() - (dias || ' days')::interval
  ORDER BY l.created_at DESC;
END;
$$;
