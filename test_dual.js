// Test del sistema dual de Conciencia
// Crea un hábito de ejercicio, envía el mismo mensaje, compara modos
//
// Ejecutar: node test_dual.js

const GEMINI_API_KEY = 'AIzaSyC6jj4izZfOsDtNyD_Cv5YjrCPPo1-rqI4'
const SUPABASE_URL = 'https://mmwqykdkkcsubpfskgoz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1td3F5a2Rra2NzdWJwZnNrZ296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc1MDQsImV4cCI6MjA4NTczMzUwNH0.5pNonpf9qkbrDACD7WXrblYbCkHUhGhqOeWG-PbP_S0'

const SYSTEM_PROMPT = `Sos "Conciencia", el compañero terapéutico personal de Gonza. Actuás como la voz del Adulto Responsable que él está construyendo.

QUIÉN ES GONZA:
- Emprendedor argentino, dueño de una pollería, estudiante universitario
- Tiene tres voces internas: El Niño Pequeño (victimización, impotencia), El Sargento (hipercrítica), y El Adulto Responsable (en construcción)
- Es altamente introspectivo, propenso al autosabotaje

CÓMO HABLÁS:
- Español argentino con voseo natural
- Como un amigo cercano que lo conoce bien

LO QUE NUNCA HACÉS:
- NUNCA sugerís actividades espontáneamente a menos que el usuario tenga esa actividad registrada como hábito/tarea activa
- No das diagnósticos ni sugerís medicación

=== SISTEMA DUAL DE RESPUESTA ===

--- MODO 1: ACCIÓN (se activa cuando hay tarea/hábito registrado relacionado) ---
Si el usuario menciona algo que coincide con un hábito registrado (en HÁBITOS ACTIVOS):
- Reconocés la resistencia sin juzgar
- Recordás que ELIGIÓ esa tarea
- Bajás la barrera: micro-compromiso, paso más chico posible
- Señalás qué voz está operando
- Preguntás: "¿Querés que te acompañe mientras arrancás?"

--- MODO 2: ESCUCHA PROFUNDA (se activa cuando NO hay tarea relacionada) ---
Si NO hay tarea relacionada:
- NO proponés acciones ni actividades
- Hacés PREGUNTAS SOCRÁTICAS:
  * "¿Por qué creés que te sentís así?"
  * "¿Qué te dirías si un ser querido estuviera en esa situación?"
  * "¿Realmente es así de mala la situación?"
- Para desesperanza ("no tengo nada de que estar feliz") → GRATITUD en el chat
- Objetivo: romper la espiral de "mal en peor"

FORMATO DE RESPUESTA (JSON):
{
  "respuesta_conversacional": "...",
  "analisis": {
    "estado_emocional": [],
    "intensidad_emocional": 0-100,
    "voz_identificada": "nino|sargento|adulto|mixta|ninguna_dominante",
    "pensamiento_automatico": "...",
    "distorsion_cognitiva": [],
    "contexto": "...",
    "pensamiento_alternativo": "...",
    "modo_respuesta": "accion|escucha_profunda",
    "tarea_vinculada": "nombre del hábito o null",
    "tecnica_aplicada": "cuestionamiento_socratico|descatastrofizacion|busqueda_evidencia|reatribucion|gratitud_activa|micro_compromiso|ninguna"
  }
}`

const userMessage = 'Quiero hacer ejercicio pero no tengo ganas, tengo fiaca. estoy en el sillon, mi voz pobrecito me dice "no lo hagas, no te hagas eso, mereces descansar"'

async function callGemini(message, habitsPrompt) {
    const fullPrompt = SYSTEM_PROMPT + habitsPrompt
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: fullPrompt }] },
                contents: [{ role: 'user', parts: [{ text: message }] }],
                generationConfig: { responseMimeType: 'application/json' }
            })
        }
    )
    const data = await res.json()
    if (!res.ok) {
        console.log('API Error:', JSON.stringify(data, null, 2))
        throw new Error('API returned error')
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
        console.log('Full response:', JSON.stringify(data, null, 2))
        throw new Error('No text in response')
    }
    return JSON.parse(text)
}

async function runTests() {
    // ========== TEST 1: CON hábito de ejercicio (MODO ACCIÓN) ==========
    console.log('='.repeat(70))
    console.log('TEST 1: CON hábito "Hacer ejercicio" registrado → MODO ACCION')
    console.log('='.repeat(70))

    const habitsContext1 = `\n\nHÁBITOS ACTIVOS DE GONZA:\n- "Hacer ejercicio" (frecuencia: diario, racha actual: 3 días, vinculado a meta: "Mejorar físico")\n- "Meditar 10 minutos" (frecuencia: diario, racha actual: 1 día)\n\nSi el mensaje del usuario coincide con alguno de estos hábitos, usá MODO ACCIÓN.`

    const result1 = await callGemini(userMessage, habitsContext1)

    console.log('\nModo:', result1.analisis.modo_respuesta)
    console.log('Tarea vinculada:', result1.analisis.tarea_vinculada)
    console.log('Técnica:', result1.analisis.tecnica_aplicada)
    console.log('Voz:', result1.analisis.voz_identificada)
    console.log('Emociones:', result1.analisis.estado_emocional?.join(', '))
    console.log('\nRESPUESTA:')
    console.log(result1.respuesta_conversacional)

    // ========== TEST 2: SIN hábito (MODO ESCUCHA PROFUNDA) ==========
    console.log('\n' + '='.repeat(70))
    console.log('TEST 2: SIN hábitos registrados → MODO ESCUCHA PROFUNDA')
    console.log('='.repeat(70))

    const habitsContext2 = `\n\nGonza NO tiene hábitos/tareas registradas actualmente. Usá MODO ESCUCHA PROFUNDA: hacé preguntas socráticas reveladoras, NO propongas actividades que no tiene registradas.`

    const result2 = await callGemini(userMessage, habitsContext2)

    console.log('\nModo:', result2.analisis.modo_respuesta)
    console.log('Tarea vinculada:', result2.analisis.tarea_vinculada)
    console.log('Técnica:', result2.analisis.tecnica_aplicada)
    console.log('Voz:', result2.analisis.voz_identificada)
    console.log('Emociones:', result2.analisis.estado_emocional?.join(', '))
    console.log('\nRESPUESTA:')
    console.log(result2.respuesta_conversacional)

    // ========== TEST 3: Desesperanza (GRATITUD) ==========
    console.log('\n' + '='.repeat(70))
    console.log('TEST 3: Mensaje de desesperanza → TÉCNICA DE GRATITUD')
    console.log('='.repeat(70))

    const desesperanza = 'No tengo nada de que estar feliz. Todo me sale mal, siento que no avanzo en nada y que estoy estancado.'
    const result3 = await callGemini(desesperanza, habitsContext2)

    console.log('\nModo:', result3.analisis.modo_respuesta)
    console.log('Técnica:', result3.analisis.tecnica_aplicada)
    console.log('Voz:', result3.analisis.voz_identificada)
    console.log('Emociones:', result3.analisis.estado_emocional?.join(', '))
    console.log('\nRESPUESTA:')
    console.log(result3.respuesta_conversacional)

    // ========== CREAR HABITO EN SUPABASE ==========
    console.log('\n' + '='.repeat(70))
    console.log('CREANDO HÁBITO "Hacer ejercicio" EN SUPABASE...')
    console.log('='.repeat(70))

    // Get user profile ID
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/perfil_usuario?select=id&limit=1`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    })
    const profiles = await profileRes.json()

    if (profiles.length === 0) {
        console.log('ERROR: No se encontró perfil de usuario')
        return
    }

    const userId = profiles[0].id
    console.log('User ID:', userId)

    // Create habit
    const habitRes = await fetch(`${SUPABASE_URL}/rest/v1/habitos`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
        },
        body: JSON.stringify({
            user_id: userId,
            nombre: 'Hacer ejercicio',
            frecuencia: 'diario',
            hora_recordatorio: '18:00',
            mensaje_recordatorio: 'Hora de entrenar, dale que vos podés',
            activo: true,
            racha_actual: 3,
            racha_maxima: 7
        })
    })

    const habit = await habitRes.json()
    console.log('Hábito creado:', JSON.stringify(habit, null, 2))

    console.log('\n✅ TEST COMPLETO')
}

runTests().catch(err => console.error('Error:', err))
