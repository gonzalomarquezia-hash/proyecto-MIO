import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, RotateCcw } from 'lucide-react'
import { sendMessageToGemini } from '../services/gemini'
import { saveEmotionalRecord, getHabitos } from '../services/supabase'

const STORAGE_KEY = 'conciencia_chat_messages'

const voiceIcons = {
    nino: '🌧️',
    sargento: '📢',
    adulto: '🛡️',
    mixta: '🔄',
    ninguna_dominante: '💭'
}

const voiceLabels = {
    nino: 'Niño',
    sargento: 'Sargento',
    adulto: 'Adulto',
    mixta: 'Mixta',
    ninguna_dominante: ''
}

// Load messages from localStorage
function loadMessages() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) return []
        const parsed = JSON.parse(saved)
        // Restore Date objects from ISO strings
        return parsed.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
    } catch {
        return []
    }
}

// Save messages to localStorage
function persistMessages(messages) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (e) {
        console.warn('Could not save chat to localStorage:', e)
    }
}

export default function ChatPage({ profile }) {
    const [messages, setMessages] = useState(() => loadMessages())
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Persist messages every time they change
    useEffect(() => {
        if (messages.length > 0) {
            persistMessages(messages)
        }
    }, [messages])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleNewConversation = useCallback(() => {
        if (messages.length === 0) return
        if (window.confirm('¿Querés iniciar una conversación nueva? La anterior se va a borrar.')) {
            setMessages([])
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [messages])

    async function handleSend() {
        const text = input.trim()
        if (!text || isLoading) return

        const userMsg = { role: 'user', content: text, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            // Fetch active habits for dual-mode detection
            let activeHabits = []
            if (profile?.id) {
                const habits = await getHabitos(profile.id)
                activeHabits = habits.filter(h => h.activo)
            }

            // Build conversation history (last 10 messages)
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }))

            // Call AI with userId for server-side vector search
            const result = await sendMessageToGemini(text, history, [], activeHabits, profile?.id)

            // Build AI message
            const aiMsg = {
                role: 'ai',
                content: result.respuesta_conversacional,
                analysis: result.analisis,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])

            // Save to Supabase (now includes embedding for vector search)
            if (profile?.id) {
                await saveEmotionalRecord({
                    user_id: profile.id,
                    mensaje_raw: text,
                    estado_emocional: result.analisis.estado_emocional || [],
                    intensidad_emocional: result.analisis.intensidad_emocional || null,
                    voz_identificada: result.analisis.voz_identificada || 'ninguna_dominante',
                    pensamiento_automatico: result.analisis.pensamiento_automatico || null,
                    distorsion_cognitiva: result.analisis.distorsion_cognitiva || [],
                    contexto: result.analisis.contexto || null,
                    pensamiento_alternativo: result.analisis.pensamiento_alternativo || null,
                    respuesta_ia: result.respuesta_conversacional,
                    tipo_registro: 'entrada_libre',
                    embedding: result.embedding || null
                })
            }
        } catch (err) {
            console.error('Chat error:', err)
            setMessages(prev => [...prev, {
                role: 'ai',
                content: 'Perdón, tuve un problema técnico. ¿Podés repetirme lo que me decías?',
                timestamp: new Date()
            }])
        }

        setIsLoading(false)
        inputRef.current?.focus()
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="chat-container">
            {/* Chat header with new conversation button */}
            {messages.length > 0 && (
                <div className="chat-header">
                    <span className="chat-header-count">{messages.length} mensajes</span>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={handleNewConversation}
                        title="Nueva conversación"
                    >
                        <RotateCcw size={14} />
                        Nueva conversación
                    </button>
                </div>
            )}

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">
                            <Sparkles size={32} color="white" />
                        </div>
                        <h2>Hola, {profile?.nombre || 'ahí'} 👋</h2>
                        <p>
                            Soy Conciencia, tu compañero de camino. Contame cómo estás,
                            qué te pasa, o simplemente charlemos. Estoy acá para escucharte.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`message-row ${msg.role}`}>
                            <div className={`message-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                {msg.role === 'user'
                                    ? (profile?.nombre?.charAt(0)?.toUpperCase() || 'G')
                                    : <Sparkles size={16} />
                                }
                            </div>
                            <div>
                                <div className="message-bubble">
                                    {msg.content}
                                </div>

                                <span className="message-time">
                                    {msg.timestamp?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="message-row ai">
                        <div className="message-avatar ai">
                            <Sparkles size={16} />
                        </div>
                        <div className="message-bubble">
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Contame, ¿cómo estás?"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        title="Enviar"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
