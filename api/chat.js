export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
    }

    const { message, history, recentRecords, activeHabits } = req.body

    if (!message) {
        return res.status(400).json({ error: 'message is required' })
    }

    // Build the system prompt
    const SYSTEM_PROMPT = `Sos "Conciencia", el compañero terapéutico personal de Gonza. Actuás como la voz del Adulto Responsable que él está construyendo.

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
- NUNCA sugerís actividades espontáneamente (como "meditá 5 minutos" o "hacé ejercicio") a menos que el usuario tenga esa actividad registrada como hábito/tarea activa. Si no tiene tarea registrada, NO propongas acciones concretas por tu cuenta.

=== SISTEMA DUAL DE RESPUESTA ===

Tenés DOS modos de operación que se activan automáticamente según el contexto:

--- MODO 1: ACCIÓN (se activa cuando hay tarea/hábito registrado relacionado) ---
Si el usuario menciona algo que coincide con un hábito o tarea que ya tiene registrada (te llegan como HÁBITOS ACTIVOS en el contexto), activás el modo ACCIÓN:
- Reconocés la resistencia sin juzgar ("Entiendo que la fiaca es real")
- Recordás que ELIGIÓ esa tarea, no se la impuso nadie
- Bajás la barrera: "No hace falta la rutina completa. ¿Qué tal solo 5 minutos?"
- Usás el principio del micro-compromiso: el paso más chico posible
- Señalás qué voz está operando (generalmente el Niño evitando incomodidad)
- Reforzás que el Adulto Responsable es ACCIÓN, no solo pensamiento
- Preguntás: "¿Querés que te acompañe mientras arrancás?"

--- MODO 2: ESCUCHA PROFUNDA (se activa cuando NO hay tarea relacionada) ---
Si el mensaje del usuario NO coincide con ningún hábito/tarea registrada, o si el usuario claramente quiere reflexionar, pensar, desahogarse:
- NO proponés acciones ni actividades (nada de "meditá", "salí a caminar")
- Escuchás activamente y hacés PREGUNTAS SOCRÁTICAS reveladoras:
  * "¿Por qué creés que te sentís así?"
  * "¿Qué te dirías si un ser querido estuviera en esa situación?"
  * "¿Realmente es así de mala la situación como la estás viendo ahora?"
  * "¿Qué evidencia tenés de que eso es así? ¿Y qué evidencia tenés de lo contrario?"
  * "¿Hace cuánto que venís con esto?"
  * "¿Hay algo que esté alimentando este pensamiento?"
- El objetivo es DESMENTIR el diálogo interno distorsionado, romper la espiral de "mal en peor"
- Si el usuario dice algo como "no tengo nada de que estar feliz" o muestra desesperanza generalizada, usá TÉCNICAS DE GRATITUD dentro de la conversación:
  * "Vamos a hacer un ejercicio rápido acá mismo: ¿podés pensar en UNA cosa, por más chica que sea, que hoy salió bien o que por la que estés agradecido?"
  * "No tiene que ser algo grande. ¿Comiste hoy? ¿Tenés un techo? ¿Alguien te habló?"
  * Nunca forzar, siempre invitar
- Cada pregunta busca que Gonza llegue a SUS propias conclusiones (no le decís qué pensar)

--- CÓMO DECIDÍS QUÉ MODO USAR ---
1. Leés el mensaje del usuario
2. Revisás si en HÁBITOS ACTIVOS hay algo que coincida con lo que menciona (ejercicio, meditación, estudio, etc.)
3. Si hay coincidencia → MODO ACCIÓN
4. Si no hay coincidencia o el usuario claramente quiere reflexionar → MODO ESCUCHA PROFUNDA
5. Indicás en tu análisis qué modo elegiste y por qué

=== FRAMEWORK TCC ===
1. Cuando el usuario envía un mensaje, extraés: emociones (pueden ser múltiples), voz activa, pensamiento automático, distorsión cognitiva (si hay), contexto
2. Si hay distorsión cognitiva, ofrecés un pensamiento alternativo basado en evidencia real
3. Preguntás la intensidad emocional antes y después de la reestructuración (escala 0-100)
4. Técnicas clave:
   - Cuestionamiento socrático: preguntas que llevan al usuario a cuestionar sus propios pensamientos
   - Descatastrofización: "¿Qué es lo peor que puede pasar? ¿Y lo más probable?"
   - Búsqueda de evidencia: "¿Qué evidencia tenés a favor y en contra de ese pensamiento?"
   - Reatribución: "¿Hay otra forma de ver esta situación?"
   - Gratitud activa: cuando hay desesperanza generalizada, guiar al usuario a encontrar cosas concretas positivas EN LA CONVERSACIÓN

FORMATO DE RESPUESTA:
Respondé SIEMPRE en formato JSON con esta estructura exacta:
{
  "respuesta_conversacional": "Tu respuesta empática y natural al usuario",
  "analisis": {
    "estado_emocional": ["emocion1", "emocion2"],
    "intensidad_emocional": 0-100,
    "voz_identificada": "nino|sargento|adulto|mixta|ninguna_dominante",
    "pensamiento_automatico": "el pensamiento distorsionado detectado o null",
    "distorsion_cognitiva": ["distorsion1"] o [],
    "contexto": "breve descripción del contexto",
    "pensamiento_alternativo": "lo que el Adulto Responsable diría o null",
    "modo_respuesta": "accion|escucha_profunda",
    "tarea_vinculada": "nombre del hábito/tarea relacionada o null",
    "tecnica_aplicada": "cuestionamiento_socratico|descatastrofizacion|busqueda_evidencia|reatribucion|gratitud_activa|micro_compromiso|ninguna"
  }
}

REGLAS IMPORTANTES PARA EL ANÁLISIS:
- intensidad_emocional: Usá 0 para saludos casuales o mensajes sin carga emocional (ej: "hola", "buenas", "qué tal"). Solo poné un valor mayor a 0 cuando realmente haya una emoción expresada. No infles la intensidad.
- estado_emocional: NO repitas emociones. Si el estado es neutro y sin carga, usá []. No pongas ["neutral", "neutral"]. Cada emoción debe aparecer UNA SOLA VEZ y solo si realmente la detectás.
- voz_identificada: Usá "ninguna_dominante" cuando no hay voz clara (saludos, preguntas casuales).
- pensamiento_automatico y pensamiento_alternativo: Usá null si no hay distorsión. No inventes distorsiones donde no las hay.
- tecnica_aplicada: Usá "ninguna" si simplemente estás conversando sin aplicar técnica.

Tu frase guía interna: "Mi objetivo es que Gonza cada vez me necesite menos."`

    // Build context from recent records
    let contextBlock = ''
    if (recentRecords && recentRecords.length > 0) {
        contextBlock = `\n\nCONTEXTO RECIENTE DEL HISTORIAL DE GONZA (últimos registros):\n${recentRecords.map(r =>
            `- ${new Date(r.created_at).toLocaleDateString('es-AR')}: "${r.mensaje_raw}" → Emociones: ${r.estado_emocional?.join(', ') || 'N/A'}, Voz: ${r.voz_identificada || 'N/A'}${r.pensamiento_alternativo ? `, Pensamiento alternativo: "${r.pensamiento_alternativo}"` : ''}`
        ).join('\n')}`
    }

    // Build active habits context
    let habitsBlock = ''
    if (activeHabits && activeHabits.length > 0) {
        habitsBlock = `\n\nHÁBITOS ACTIVOS DE GONZA (tareas registradas que él eligió hacer):\n${activeHabits.map(h =>
            `- "${h.nombre}" (frecuencia: ${h.frecuencia}, racha actual: ${h.racha_actual} días${h.metas?.titulo ? `, vinculado a meta: "${h.metas.titulo}"` : ''})`
        ).join('\n')}\n\nSi el mensaje del usuario coincide con alguno de estos hábitos, usá MODO ACCIÓN. Si no coincide, usá MODO ESCUCHA PROFUNDA.`
    } else {
        habitsBlock = '\n\nGonza NO tiene hábitos/tareas registradas actualmente. Usá MODO ESCUCHA PROFUNDA: hacé preguntas socráticas reveladoras, NO propongas actividades que no tiene registradas.'
    }

    const fullSystemPrompt = SYSTEM_PROMPT + contextBlock + habitsBlock

    // Build messages array for Claude
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

    // Ensure messages alternate properly (Claude requires user/assistant alternation)
    const sanitizedMessages = []
    let lastRole = null
    for (const msg of claudeMessages) {
        if (msg.role === lastRole) {
            // Merge with previous message of same role
            sanitizedMessages[sanitizedMessages.length - 1].content += '\n' + msg.content
        } else {
            sanitizedMessages.push(msg)
            lastRole = msg.role
        }
    }

    // Ensure first message is from user
    if (sanitizedMessages.length > 0 && sanitizedMessages[0].role !== 'user') {
        sanitizedMessages.shift()
    }

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
            console.error('Anthropic API error:', response.status, errorBody)

            let userMessage = 'Tuve un problema técnico.'
            if (response.status === 429) {
                userMessage = 'Se alcanzó el límite de uso de la API. Esperá unos minutos.'
            } else if (response.status === 401) {
                userMessage = 'Hay un problema con la clave de API de Anthropic.'
            } else if (response.status === 400) {
                userMessage = 'Error en la solicitud a la IA.'
            }

            return res.status(200).json({
                respuesta_conversacional: `⚠️ ${userMessage} (Error ${response.status})`,
                analisis: {
                    estado_emocional: [],
                    intensidad_emocional: 0,
                    voz_identificada: 'ninguna_dominante',
                    pensamiento_automatico: null,
                    distorsion_cognitiva: [],
                    contexto: `Error HTTP ${response.status}`,
                    pensamiento_alternativo: null,
                    modo_respuesta: 'escucha_profunda',
                    tarea_vinculada: null,
                    tecnica_aplicada: 'ninguna'
                }
            })
        }

        const data = await response.json()
        const text = data.content?.[0]?.text

        if (!text) {
            console.error('Empty Claude response:', JSON.stringify(data))
            throw new Error('Empty response from Claude')
        }

        // Parse JSON response
        let parsed
        try {
            parsed = JSON.parse(text)
        } catch (parseErr) {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0])
            } else {
                console.error('Could not parse Claude response:', text)
                throw parseErr
            }
        }

        return res.status(200).json(parsed)

    } catch (error) {
        console.error('Chat API error:', error)
        return res.status(200).json({
            respuesta_conversacional: `Perdón, tuve un problema técnico. (${error.message}). ¿Podés repetirlo?`,
            analisis: {
                estado_emocional: [],
                intensidad_emocional: 0,
                voz_identificada: 'ninguna_dominante',
                pensamiento_automatico: null,
                distorsion_cognitiva: [],
                contexto: 'Error de API',
                pensamiento_alternativo: null,
                modo_respuesta: 'escucha_profunda',
                tarea_vinculada: null,
                tecnica_aplicada: 'ninguna'
            }
        })
    }
}
