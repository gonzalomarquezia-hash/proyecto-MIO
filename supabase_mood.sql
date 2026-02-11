-- Nuevos campos: estado de ánimo y síntomas físicos
ALTER TABLE registros_emocionales ADD COLUMN IF NOT EXISTS estado_animo int;
ALTER TABLE registros_emocionales ADD COLUMN IF NOT EXISTS sintomas_fisicos text[];
