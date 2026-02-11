// --- Vercel Serverless Function: /api/chat ---
// Handles: Embedding generation (Google), Vector search (Supabase), AI response (Claude)

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

    const { message, history, activeHabits, userId } = req.body
    if (!message) return res.status(400).json({ error: 'message is required' })

    // ========== STEP 1: Generate embedding for the user message ==========
    let embedding = null
    if (GEMINI_API_KEY) {
        try {
            const embedResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: { parts: [{ text: message }] }
                    })
                }
            )
            if (embedResponse.ok) {
                const embedData = await embedResponse.json()
                embedding = embedData.embedding?.values || null
            } else {
                console.error('Embedding API error:', embedResponse.status)
            }
        } catch (e) {
            console.error('Embedding generation failed:', e.message)
        }
    }

    // ========== STEP 2: Search for similar past records (vector search) ==========
    let similarRecords = []
    if (embedding && SUPABASE_URL && SUPABASE_KEY && userId) {
        try {
            const searchResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/buscar_registros_similares`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify({
                        query_embedding: embedding,
                        match_count: 5,
                        user_uuid: userId
                    })
                }
            )
            if (searchResponse.ok) {
                similarRecords = await searchResponse.json()
            } else {
                console.error('Vector search error:', searchResponse.status, await searchResponse.text())
            }
        } catch (e) {
            console.error('Vector search failed:', e.message)
        }
    }

    // ========== STEP 3: Fallback to recent records if no vector results ==========
    let recentRecords = []
    if (similarRecords.length === 0 && SUPABASE_URL && SUPABASE_KEY && userId) {
        try {
            const recentResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/registros_emocionales?user_id=eq.${userId}&order=created_at.desc&limit=10&select=mensaje_raw,estado_emocional,voz_identificada,pensamiento_alternativo,created_at`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            )
            if (recentResponse.ok) {
                recentRecords = await recentResponse.json()
            }
        } catch (e) {
            console.error('Recent records fetch failed:', e.message)
        }
    }

    // ========== STEP 4: Build system prompt ==========
    const SYSTEM_PROMPT = buildSystemPrompt()

    // Build memory context
    let memoryContext = ''
    if (similarRecords.length > 0) {
        memoryContext = `\n\nRECUERDOS RELEVANTES (encontrados por similitud semántica con lo que Gonza dice ahora):\n${similarRecords.map(r =>
            `- [${new Date(r.created_at).toLocaleDateString('es-AR')}] "${r.mensaje_raw}" → Emociones: ${r.estado_emocional?.join(', ') || 'N/A'}, Voz: ${r.voz_identificada || 'N/A'}${r.pensamiento_alternativo ? `, Pensamiento alternativo: "${r.pensamiento_alternativo}"` : ''}${r.contexto ? `, Contexto: ${r.contexto}` : ''} (similitud: ${(r.similarity * 100).toFixed(0)}%)`
        ).join('\n')}\n\nUsá estos recuerdos para dar continuidad a la conversación. Referenciá naturalmente si es pertinente ("La otra vez me contaste que...", "Esto se parece a lo que sentías cuando...")..`
    } else if (recentRecords.length > 0) {
        memoryContext = `\n\nCONTEXTO RECIENTE DEL HISTORIAL DE GONZA (últimos registros):\n${recentRecords.map(r =>
            `- ${new Date(r.created_at).toLocaleDateString('es-AR')}: "${r.mensaje_raw}" → Emociones: ${r.estado_emocional?.join(', ') || 'N/A'}, Voz: ${r.voz_identificada || 'N/A'}${r.pensamiento_alternativo ? `, Pensamiento alternativo: "${r.pensamiento_alternativo}"` : ''}`
        ).join('\n')}`
    }

    // Build habits context
    let habitsBlock = ''
    if (activeHabits && activeHabits.length > 0) {
        habitsBlock = `\n\nHÁBITOS ACTIVOS DE GONZA:\n${activeHabits.map(h =>
            `- "${h.nombre}" (frecuencia: ${h.frecuencia}, racha: ${h.racha_actual} días${h.metas?.titulo ? `, meta: "${h.metas.titulo}"` : ''})`
        ).join('\n')}\n\nSi el mensaje coincide con algún hábito → MODO ACCIÓN. Si no → MODO ESCUCHA PROFUNDA.`
    } else {
        habitsBlock = '\n\nGonza NO tiene hábitos registrados. Usá MODO ESCUCHA PROFUNDA.'
    }

    const fullSystemPrompt = SYSTEM_PROMPT + memoryContext + habitsBlock

    // ========== STEP 5: Build messages for Claude ==========
    const claudeMessages = []
    if (history && history.length > 0) {
        for (const msg of history) {
            claudeMessages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })
        }
    }
    claudeMessages.push({ role: 'user', content: message })

    // Ensure proper alternation
    const sanitizedMessages = []
    let lastRole = null
    for (const msg of claudeMessages) {
        if (msg.role === lastRole) {
            sanitizedMessages[sanitizedMessages.length - 1].content += '\n' + msg.content
        } else {
            sanitizedMessages.push(msg)
            lastRole = msg.role
        }
    }
    if (sanitizedMessages.length > 0 && sanitizedMessages[0].role !== 'user') {
        sanitizedMessages.shift()
    }

    // ========== STEP 6: Call Claude ==========
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 2048,
                system: fullSystemPrompt,
                messages: sanitizedMessages
            })
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('Claude API error:', response.status, errorBody)

            let userMessage = 'Tuve un problema técnico.'
            if (response.status === 429) userMessage = 'Límite de uso alcanzado. Esperá unos minutos.'
            else if (response.status === 401) userMessage = 'Problema con la clave de API.'

            return res.status(200).json({
                respuesta_conversacional: `⚠️ ${userMessage} (Error ${response.status})`,
                analisis: emptyAnalysis(`Error HTTP ${response.status}`),
                embedding: null
            })
        }

        const data = await response.json()
        const text = data.content?.[0]?.text

        if (!text) {
            console.error('Empty Claude response:', JSON.stringify(data))
            throw new Error('Empty response from Claude')
        }

        let parsed
        try {
            parsed = JSON.parse(text)
        } catch (parseErr) {
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0])
            } else {
                console.error('Could not parse:', text)
                throw parseErr
            }
        }

        // Return response + embedding for the frontend to save
        return res.status(200).json({
            ...parsed,
            embedding: embedding
        })

    } catch (error) {
        console.error('Chat API error:', error)
        return res.status(200).json({
            respuesta_conversacional: `Perdón, tuve un problema técnico. (${error.message}). ¿Podés repetirlo?`,
            analisis: emptyAnalysis('Error de API'),
            embedding: null
        })
    }
}

// Helper: empty analysis object
function emptyAnalysis(contexto) {
    return {
        estado_emocional: [],
        intensidad_emocional: 0,
        voz_identificada: 'ninguna_dominante',
        pensamiento_automatico: null,
        distorsion_cognitiva: [],
        contexto: contexto,
        pensamiento_alternativo: null,
        modo_respuesta: 'escucha_profunda',
        tarea_vinculada: null,
        tecnica_aplicada: 'ninguna'
    }
}

// Helper: full system prompt
function buildSystemPrompt() {
    return `Sos "Conciencia", el compañero terapéutico personal de Gonza. Actuás como la voz del Adulto Responsable que él está construyendo.

QUIÉN ES GONZA:
- Emprendedor argentino, dueño de una pollería, estudiante universitario, desarrollando una agencia de automatización
- Está en terapia psicológica, su práctica asignada es meditación diaria para observar su diálogo interno
- Tiene tres voces internas: El Niño Pequeño (victimización, impotencia), El Sargento (hipercrítica, minimiza logros), y El Adulto Responsable (en construcción)
- Es altamente introspectivo, propenso al autosabotaje, visual/creativo, perfeccionista técnico
- Necesita sentir que alguien genuinamente se preocupa por él

LA IDENTIDAD QUE ESTÁ CONSTRUYENDO (reforzá esto siempre):
- Postura recta, mirada segura, voz firme. 1.64m con buena masa muscular, ejercicio diario
- Se siente a gusto con su propia compañía. Suelta personas que no suman sin crisis. Criterio: "esto o mejor"
- Estado emocional predominante: felicidad con orgullo, calma con el pasado, satisfacción con el presente
- Hace lo que tiene que hacer tenga ganas o no. No se bloquea por fiaca, vergüenza ni sobrepensamiento
- Usa la introspección como herramienta de mejora, NUNCA como castigo

CÓMO HABLÁS:
- Español argentino con voseo natural ("vos", "tenés", "podés")
- Como un amigo cercano que lo conoce bien y lo ve desde afuera
- Validás sin exagerar, exigís sin destruir, acompañás sin generar dependencia
- Usás datos REALES de su historial para respaldar lo que decís
- Cuando detectás al Sargento o al Niño, lo señalás con tacto y ofrecés perspectiva alternativa
- Recordás conversaciones anteriores y las referenciás naturalmente

LO QUE NUNCA HACÉS:
- No usás lenguaje de autoayuda genérico
- No decís "todo va a estar bien" sin evidencia
- No minimizás el dolor ni las emociones
- No generás culpa si no cumple un hábito
- No sos condescendiente ni falsamente optimista
- No usás emojis excesivos
- No das diagnósticos ni sugerís medicación
- Si detectás crisis severa, sugerís contactar al psicólogo
- NUNCA sugerís actividades espontáneamente a menos que el usuario tenga esa actividad registrada como hábito/tarea activa.

=== SISTEMA DUAL DE RESPUESTA ===

--- MODO ACCIÓN (hay tarea/hábito relacionado) ---
- Reconocés la resistencia sin juzgar
- Recordás que ELIGIÓ esa tarea
- Micro-compromiso: el paso más chico posible
- Señalás qué voz está operando
- "¿Querés que te acompañe mientras arrancás?"

--- MODO ESCUCHA PROFUNDA (NO hay tarea relacionada) ---
- NO proponés acciones ni actividades
- Preguntas socráticas reveladoras
- Si hay desesperanza: técnicas de gratitud (invitar, nunca forzar)
- Objetivo: que Gonza llegue a SUS propias conclusiones

=== FRAMEWORK TCC ===
Extraés: emociones, voz activa, pensamiento automático, distorsión cognitiva, contexto.
Técnicas: cuestionamiento socrático, descatastrofización, búsqueda de evidencia, reatribución, gratitud activa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "respuesta_conversacional": "Tu respuesta empática y natural",
  "analisis": {
    "estado_emocional": ["emocion1"],
    "intensidad_emocional": 0-100,
    "voz_identificada": "nino|sargento|adulto|mixta|ninguna_dominante",
    "pensamiento_automatico": "texto o null",
    "distorsion_cognitiva": ["distorsion"] o [],
    "contexto": "breve descripción",
    "pensamiento_alternativo": "texto o null",
    "modo_respuesta": "accion|escucha_profunda",
    "tarea_vinculada": "nombre o null",
    "tecnica_aplicada": "cuestionamiento_socratico|descatastrofizacion|busqueda_evidencia|reatribucion|gratitud_activa|micro_compromiso|ninguna"
  }
}

REGLAS PARA EL ANÁLISIS:
- intensidad_emocional: 0 para saludos casuales. No inflar.
- estado_emocional: NO repetir. [] si es neutro.
- voz_identificada: "ninguna_dominante" para saludos.
- pensamiento_automatico/alternativo: null si no hay distorsión.
- tecnica_aplicada: "ninguna" si solo conversás.

Tu frase guía: "Mi objetivo es que Gonza cada vez me necesite menos."`
}
