-- ============================================
-- PASO 3: Vectorización — Memoria a largo plazo
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Activar la extensión de vectores
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Agregar columna de embedding a los registros emocionales
-- Usa 768 dimensiones (compatible con text-embedding-004 de Google)
ALTER TABLE registros_emocionales 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Función de búsqueda semántica
-- Busca los registros más parecidos a un mensaje dado
CREATE OR REPLACE FUNCTION buscar_registros_similares(
  query_embedding vector(768),
  match_count int DEFAULT 5,
  user_uuid uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  mensaje_raw text,
  respuesta_ia text,
  estado_emocional text[],
  voz_identificada text,
  contexto text,
  pensamiento_alternativo text,
  pensamiento_automatico text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    re.id,
    re.mensaje_raw,
    re.respuesta_ia,
    re.estado_emocional,
    re.voz_identificada,
    re.contexto,
    re.pensamiento_alternativo,
    re.pensamiento_automatico,
    re.created_at,
    1 - (re.embedding <=> query_embedding) AS similarity
  FROM registros_emocionales re
  WHERE re.user_id = user_uuid 
    AND re.embedding IS NOT NULL
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Índice para búsquedas rápidas (se puede agregar después cuando haya más datos)
-- CREATE INDEX IF NOT EXISTS registros_embedding_idx 
-- ON registros_emocionales USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'registros_emocionales' AND column_name = 'embedding';
