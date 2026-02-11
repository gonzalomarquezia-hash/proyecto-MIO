import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, RotateCcw, Square } from 'lucide-react'
import { sendMessageToGemini } from '../services/gemini'
import { saveEmotionalRecord, getHabitos, saveLogro } from '../services/supabase'
import Confetti from '../components/Confetti'

const STORAGE_KEY = 'conciencia_chat_messages'

// Detect if device has a touchscreen (mobile)
function isMobileDevice() {
    return window.matchMedia('(pointer: coarse)').matches
}

// Load messages from localStorage
function loadMessages() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) return []
        const parsed = JSON.parse(saved)
        return parsed.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
    } catch {
        return []
    }
}

function persistMessages(messages) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (e) {
        console.warn('Could not save chat to localStorage:', e)
    }
}

// Detect category for a logro based on context
function detectLogroCategoria(analisis) {
    const ctx = (analisis?.contexto || '').toLowerCase()
    const logro = (analisis?.logro_detectado || '').toLowerCase()
    const combined = ctx + ' ' + logro
    if (combined.includes('medita') || combined.includes('autocuidado') || combined.includes('levant')) return 'autocuidado'
    if (combined.includes('poller') || combined.includes('trabajo') || combined.includes('tarea') || combined.includes('estudi')) return 'productividad'
    if (combined.includes('límite') || combined.includes('relaci') || combined.includes('social')) return 'social'
    if (combined.includes('ejerci') || combined.includes('físic') || combined.includes('camin')) return 'fisico'
    if (combined.includes('emoci') || combined.includes('impulso') || combined.includes('control')) return 'emocional'
    return 'general'
}

export default function ChatPage({ profile }) {
    const [messages, setMessages] = useState(() => loadMessages())
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const abortControllerRef = useRef(null)

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

    // Stop the AI response generation
    function handleStop() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsLoading(false)
    }

    async function handleSend() {
        const text = input.trim()
        if (!text || isLoading) return

        const userMsg = { role: 'user', content: text, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        // Create AbortController for this request
        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            let activeHabits = []
            if (profile?.id) {
                const habits = await getHabitos(profile.id)
                activeHabits = habits.filter(h => h.activo)
            }

            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }))

            const result = await sendMessageToGemini(text, history, [], activeHabits, profile?.id, controller.signal)

            // If aborted, don't process response
            if (controller.signal.aborted) return

            const aiMsg = {
                role: 'ai',
                content: result.respuesta_conversacional,
                analysis: result.analisis,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])

            // Save to Supabase with new fields
            if (profile?.id) {
                await saveEmotionalRecord({
                    user_id: profile.id,
                    mensaje_raw: text,
                    estado_emocional: result.analisis?.estado_emocional || [],
                    intensidad_emocional: result.analisis?.intensidad_emocional || null,
                    voz_identificada: result.analisis?.voz_identificada || 'ninguna_dominante',
                    pensamiento_automatico: result.analisis?.pensamiento_automatico || null,
                    distorsion_cognitiva: result.analisis?.distorsion_cognitiva || [],
                    contexto: result.analisis?.contexto || null,
                    pensamiento_alternativo: result.analisis?.pensamiento_alternativo || null,
                    respuesta_ia: result.respuesta_conversacional,
                    tipo_registro: 'entrada_libre',
                    embedding: result.embedding || null,
                    estado_animo: result.analisis?.estado_animo || null,
                    sintomas_fisicos: result.analisis?.sintomas_fisicos || [],
                    logro_detectado: result.analisis?.logro_detectado || null
                })

                // If a logro was detected, save it and celebrate! 🎊
                if (result.analisis?.logro_detectado) {
                    setShowConfetti(true)
                    await saveLogro({
                        user_id: profile.id,
                        descripcion: result.analisis.logro_detectado,
                        categoria: detectLogroCategoria(result.analisis),
                        fuente: 'implicito',
                        mensaje_origen: text
                    })
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: '⏹️ Respuesta cancelada.',
                    timestamp: new Date()
                }])
            } else {
                console.error('Chat error:', err)
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: 'Perdón, tuve un problema técnico. ¿Podés repetirme lo que me decías?',
                    timestamp: new Date()
                }])
            }
        }

        abortControllerRef.current = null
        setIsLoading(false)
        inputRef.current?.focus()
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            // On mobile: Enter always makes a new line
            if (isMobileDevice()) {
                return // let the default behavior (new line) happen
            }
            // On desktop: Enter sends, Shift+Enter makes new line
            if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
            }
        }
    }

    return (
        <div className="chat-container">
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
                    {isLoading ? (
                        <button
                            className="chat-stop-btn"
                            onClick={handleStop}
                            title="Detener respuesta"
                        >
                            <Square size={16} />
                        </button>
                    ) : (
                        <button
                            className="chat-send-btn"
                            onClick={handleSend}
                            disabled={!input.trim()}
                            title="Enviar"
                        >
                            <Send size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Confetti celebration for micro-logros */}
            <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        </div>
    )
}
