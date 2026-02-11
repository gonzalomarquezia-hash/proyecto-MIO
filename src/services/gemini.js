// AI Service — calls the serverless function at /api/chat
// The API key stays server-side, never exposed to the browser

export async function sendMessageToGemini(userMessage, conversationHistory = [], recentRecords = [], activeHabits = [], userId = null, signal = null) {
    try {
        const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                history: conversationHistory.slice(-10).map(m => ({
                    role: m.role === 'ai' ? 'assistant' : m.role,
                    content: m.content
                })),
                activeHabits,
                userId
            })
        }

        // Add abort signal if provided
        if (signal) fetchOptions.signal = signal

        const response = await fetch('/api/chat', fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Chat API error:', response.status, errorText)
            throw new Error(`API error: ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        // Re-throw AbortError so ChatPage can handle it
        if (error.name === 'AbortError') throw error

        console.error('Chat service error:', error)
        return {
            respuesta_conversacional: `Perdón, tuve un problema técnico. (${error.message}). ¿Podés repetirlo?`,
            analisis: {
                estado_emocional: [],
                intensidad_emocional: 0,
                voz_identificada: 'ninguna_dominante',
                pensamiento_automatico: null,
                distorsion_cognitiva: [],
                contexto: 'Error de conexión',
                pensamiento_alternativo: null,
                modo_respuesta: 'escucha_pasiva',
                tarea_vinculada: null,
                tecnica_aplicada: 'ninguna',
                estado_animo: null,
                sintomas_fisicos: []
            },
            embedding: null
        }
    }
}
