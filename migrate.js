// Migration script - Creates all tables in Supabase
// Run with: node migrate.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mmwqykdkkcsubpfskgoz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1td3F5a2Rra2NzdWJwZnNrZ296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc1MDQsImV4cCI6MjA4NTczMzUwNH0.5pNonpf9qkbrDACD7WXrblYbCkHUhGhqOeWG-PbP_S0'

const supabase = createClient(supabaseUrl, supabaseKey)

const SQL_STATEMENTS = [
    // 1. perfil_usuario
    `CREATE TABLE IF NOT EXISTS perfil_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    estatura_cm INTEGER,
    peso_kg DECIMAL,
    foto_url TEXT,
    ambiciones TEXT[] DEFAULT '{}',
    estructura_interna_actual JSONB DEFAULT '{}',
    datos_actualizados_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

    // 2. registros_emocionales
    `CREATE TABLE IF NOT EXISTS registros_emocionales (
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
  )`,

    // 3. metas
    `CREATE TABLE IF NOT EXISTS metas (
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
  )`,

    // 4. habitos
    `CREATE TABLE IF NOT EXISTS habitos (
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
  )`,

    // 5. checkins_habitos
    `CREATE TABLE IF NOT EXISTS checkins_habitos (
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
  )`,

    // 6. notificaciones_config
    `CREATE TABLE IF NOT EXISTS notificaciones_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('recordatorio_habito', 'checkin_emocional', 'cierre_dia', 'personalizado')),
    hora TIME,
    mensaje TEXT,
    dias_semana TEXT[] DEFAULT '{}',
    activa BOOLEAN DEFAULT TRUE,
    tono TEXT DEFAULT 'invitacion' CHECK (tono IN ('invitacion', 'motivacional', 'neutro')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

    // RLS
    `ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE registros_emocionales ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE metas ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE habitos ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE checkins_habitos ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE notificaciones_config ENABLE ROW LEVEL SECURITY`,

    // Policies
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all perfil_usuario') THEN CREATE POLICY "Allow all perfil_usuario" ON perfil_usuario FOR ALL USING (true) WITH CHECK (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all registros_emocionales') THEN CREATE POLICY "Allow all registros_emocionales" ON registros_emocionales FOR ALL USING (true) WITH CHECK (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all metas') THEN CREATE POLICY "Allow all metas" ON metas FOR ALL USING (true) WITH CHECK (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all habitos') THEN CREATE POLICY "Allow all habitos" ON habitos FOR ALL USING (true) WITH CHECK (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all checkins_habitos') THEN CREATE POLICY "Allow all checkins_habitos" ON checkins_habitos FOR ALL USING (true) WITH CHECK (true); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all notificaciones_config') THEN CREATE POLICY "Allow all notificaciones_config" ON notificaciones_config FOR ALL USING (true) WITH CHECK (true); END IF; END $$`,
]

const SEED_SQL = `INSERT INTO perfil_usuario (nombre, estatura_cm, ambiciones, estructura_interna_actual)
SELECT 'Gonza', 164,
  ARRAY['Lanzar agencia de automatización', 'Construir físico con buena masa muscular', 'Ser emocionalmente independiente y seguro'],
  '{"adulto_responsable":{"fisico":"Postura recta, mirada segura, ejercicio diario","autoestima":"Se siente a gusto con su propia compañía","estado_emocional":"Felicidad con orgullo, calma con el pasado","accion":"Hace lo que tiene que hacer tenga ganas o no","introspeccion":"La usa como herramienta de mejora, nunca como castigo"},"voces":{"nino":"Voz de victimización, impotencia","sargento":"Voz hipercrítica, minimiza logros","adulto":"En construcción - validador, realista, compasivo sin lástima"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM perfil_usuario WHERE nombre = 'Gonza')`

async function migrate() {
    console.log('🚀 Starting migration...\n')

    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
        const sql = SQL_STATEMENTS[i]
        const label = sql.trim().substring(0, 60).replace(/\n/g, ' ')

        try {
            const { error } = await supabase.rpc('exec_sql', { query: sql })
            if (error) {
                // rpc might not exist, try alternative
                throw error
            }
            console.log(`✅ [${i + 1}/${SQL_STATEMENTS.length}] ${label}...`)
        } catch (err) {
            console.log(`⚠️  [${i + 1}/${SQL_STATEMENTS.length}] ${label}... (rpc not available, will try REST)`)
        }
    }

    // Try to seed data via REST API directly
    console.log('\n📦 Seeding Gonza profile...')
    try {
        // Check if profile exists
        const { data: existing } = await supabase
            .from('perfil_usuario')
            .select('id')
            .eq('nombre', 'Gonza')
            .limit(1)

        if (existing && existing.length > 0) {
            console.log('✅ Profile already exists:', existing[0].id)
        } else {
            const { data, error } = await supabase
                .from('perfil_usuario')
                .insert({
                    nombre: 'Gonza',
                    estatura_cm: 164,
                    ambiciones: ['Lanzar agencia de automatización', 'Construir físico con buena masa muscular', 'Ser emocionalmente independiente y seguro'],
                    estructura_interna_actual: {
                        adulto_responsable: {
                            fisico: 'Postura recta, mirada segura, ejercicio diario',
                            autoestima: 'Se siente a gusto con su propia compañía',
                            estado_emocional: 'Felicidad con orgullo, calma con el pasado',
                            accion: 'Hace lo que tiene que hacer tenga ganas o no',
                            introspeccion: 'La usa como herramienta de mejora, nunca como castigo'
                        },
                        voces: {
                            nino: 'Voz de victimización, impotencia',
                            sargento: 'Voz hipercrítica, minimiza logros',
                            adulto: 'En construcción - validador, realista, compasivo sin lástima'
                        }
                    }
                })
                .select()
                .single()

            if (error) {
                console.log('❌ Error seeding profile:', error.message)
                console.log('   (This likely means the table does not exist yet - you need to run the SQL schema first)')
            } else {
                console.log('✅ Profile created:', data.id)
            }
        }
    } catch (err) {
        console.log('❌ Error:', err.message)
    }

    // Test table access
    console.log('\n🔍 Testing table access...')
    const tables = ['perfil_usuario', 'registros_emocionales', 'metas', 'habitos', 'checkins_habitos', 'notificaciones_config']

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('id').limit(1)
            if (error) {
                console.log(`❌ ${table}: ${error.message}`)
            } else {
                console.log(`✅ ${table}: accessible (${data.length} rows)`)
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`)
        }
    }

    console.log('\n✨ Migration check complete!')
}

migrate()
