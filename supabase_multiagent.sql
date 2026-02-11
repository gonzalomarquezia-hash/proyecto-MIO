-- ============================================
-- MULTI-AGENT ARCHITECTURE: Schema completo
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES perfil_usuario(id),
  modo text NOT NULL DEFAULT 'escucha',
  titulo text,
  intencion text,
  descripcion_breve text,
  recomendacion_modo text,
  recomendacion_texto text,
  recomendacion_contexto text,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabla de mensajes de chat (persistencia real, no localStorage)
CREATE TABLE IF NOT EXISTS mensajes_chat (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id uuid REFERENCES conversaciones(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  analysis jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. Vincular registros emocionales a conversaciones
ALTER TABLE registros_emocionales ADD COLUMN IF NOT EXISTS conversacion_id uuid REFERENCES conversaciones(id);

-- 4. RLS
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversaciones_all" ON conversaciones FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mensajes_chat_all" ON mensajes_chat FOR ALL USING (true) WITH CHECK (true);

-- 5. Función para obtener conversaciones recientes
CREATE OR REPLACE FUNCTION obtener_conversaciones(
  user_uuid uuid,
  limite int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  modo text,
  titulo text,
  intencion text,
  descripcion_breve text,
  recomendacion_modo text,
  recomendacion_texto text,
  recomendacion_contexto text,
  activa boolean,
  created_at timestamptz,
  updated_at timestamptz,
  mensaje_count bigint
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.modo, c.titulo, c.intencion, c.descripcion_breve,
         c.recomendacion_modo, c.recomendacion_texto, c.recomendacion_contexto,
         c.activa, c.created_at, c.updated_at,
         (SELECT count(*) FROM mensajes_chat m WHERE m.conversacion_id = c.id) as mensaje_count
  FROM conversaciones c
  WHERE c.user_id = user_uuid
  ORDER BY c.updated_at DESC
  LIMIT limite;
END;
$$;
