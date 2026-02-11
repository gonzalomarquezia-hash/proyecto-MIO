import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, RotateCcw, Square, Clock, Plus } from 'lucide-react'
import { sendMessageToGemini } from '../services/gemini'
import {
    saveEmotionalRecord, getHabitos, saveLogro,
    createConversacion, updateConversacion,
    saveChatMessage, getChatMessages
} from '../services/supabase'
import Confetti from '../components/Confetti'
import ModeSelector, { MODES } from '../components/ModeSelector'
import RecommendationCard from '../components/RecommendationCard'
import ChatHistory from '../components/ChatHistory'

// Detect if device has a touchscreen (mobile)
function isMobileDevice() {
    return window.matchMedia('(pointer: coarse)').matches
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

// Check if logro is genuinely detected (not empty, not "null" string)
function isRealLogro(logro) {
    if (!logro) return false
    if (typeof logro !== 'string') return false
    const trimmed = logro.trim().toLowerCase()
    if (trimmed === '' || trimmed === 'null' || trimmed === 'ninguno' || trimmed === 'no' || trimmed === 'n/a') return false
    return true
}

export default function ChatPage({ profile }) {
    // Conversation state
    const [activeConversation, setActiveConversation] = useState(null)
    const [selectedMode, setSelectedMode] = useState(null)
    const [messages, setMessages] = useState([])

    // UI state
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const abortControllerRef = useRef(null)

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    // Focus input when conversation starts
    useEffect(() => {
        if (selectedMode && !isLoading) {
            inputRef.current?.focus()
        }
    }, [selectedMode, isLoading])

    // Load messages when a conversation is selected
    const loadConversation = useCallback(async (conv) => {
        setActiveConversation(conv)
        setSelectedMode(conv.modo)
        const msgs = await getChatMessages(conv.id)
        setMessages(msgs.map(m => ({
            role: m.role,
            content: m.content,
            analysis: m.analysis,
            timestamp: new Date(m.created_at)
        })))
    }, [])

    // Start a new conversation with a selected mode
    async function handleSelectMode(modo) {
        setSelectedMode(modo)
        setMessages([])
        setActiveConversation(null)
        // Conversation is created on first message send
    }

    // New chat (reset everything)
    function handleNewConversation() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setActiveConversation(null)
        setSelectedMode(null)
        setMessages([])
        setInput('')
        setIsLoading(false)
    }

    // Handle recommendation: start new conversation in suggested mode with context
    async function handleAcceptRecommendation(recomendacion) {
        const newModo = recomendacion.modo_sugerido
        setSelectedMode(newModo)
        setMessages([])

        // Create a new conversation with the recommendation context
        if (profile?.id) {
            const conv = await createConversacion({
                user_id: profile.id,
                modo: newModo,
                titulo: recomendacion.contexto_para_agente?.substring(0, 60) || null,
                intencion: recomendacion.contexto_para_agente || null,
                descripcion_breve: recomendacion.motivo || null
            })
            setActiveConversation(conv)

            // Send context as a hidden first user message so the agent knows what's going on
            if (recomendacion.contexto_para_agente) {
                const contextMsg = `[Contexto de otra conversación] ${recomendacion.contexto_para_agente}`
                const userMsg = {
                    role: 'user',
                    content: contextMsg,
                    timestamp: new Date()
                }
                setMessages([userMsg])
                setIsLoading(true)

                try {
                    const activeHabits = await getHabitos(profile.id)
                    const result = await sendMessageToGemini(
                        contextMsg, [], [], activeHabits, profile.id, null, newModo, conv?.id
                    )

                    const aiMsg = {
                        role: 'ai',
                        content: result.respuesta_conversacional,
                        analysis: result.analisis,
                        timestamp: new Date()
                    }
                    setMessages(prev => [...prev, aiMsg])

                    // Save both messages
                    await saveChatMessage({ conversacion_id: conv.id, role: 'user', content: contextMsg })
                    await saveChatMessage({ conversacion_id: conv.id, role: 'ai', content: result.respuesta_conversacional, analysis: result.analisis })
                } catch (e) {
                    console.error('Recommendation context error:', e)
                }
                setIsLoading(false)
            }
        } else {
            setActiveConversation(null)
        }
    }

    // Main send handler
    async function handleSend() {
        const text = input.trim()
        if (!text || isLoading) return

        setInput('')
        const userMsg = { role: 'user', content: text, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            const activeHabits = profile?.id ? await getHabitos(profile.id) : []

            // Create conversation on first message if needed
            let convId = activeConversation?.id
            if (!convId && profile?.id) {
                const conv = await createConversacion({
                    user_id: profile.id,
                    modo: selectedMode || 'escucha',
                    titulo: text.substring(0, 60)
                })
                setActiveConversation(conv)
                convId = conv?.id
            }

            const result = await sendMessageToGemini(
                text, messages, [], activeHabits, profile?.id,
                controller.signal, selectedMode || 'escucha', convId
            )

            if (controller.signal.aborted) return

            const aiMsg = {
                role: 'ai',
                content: result.respuesta_conversacional,
                analysis: result.analisis,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])

            // Save messages to Supabase
            if (convId) {
                await saveChatMessage({ conversacion_id: convId, role: 'user', content: text })
                await saveChatMessage({ conversacion_id: convId, role: 'ai', content: result.respuesta_conversacional, analysis: result.analisis })

                // Update conversation metadata
                const updates = {}
                if (result.analisis?.contexto) updates.descripcion_breve = result.analisis.contexto
                if (result.analisis?.recomendacion) {
                    updates.recomendacion_modo = result.analisis.recomendacion.modo_sugerido
                    updates.recomendacion_texto = result.analisis.recomendacion.motivo
                    updates.recomendacion_contexto = result.analisis.recomendacion.contexto_para_agente
                }
                if (Object.keys(updates).length > 0) {
                    await updateConversacion(convId, updates)
                }
            }

            // Save emotional record
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
                    logro_detectado: result.analisis?.logro_detectado || null,
                    conversacion_id: convId || null
                })

                // If a real logro was detected, celebrate
                if (isRealLogro(result.analisis?.logro_detectado)) {
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

    function handleStop() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setIsLoading(false)
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            if (isMobileDevice()) return
            if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
            }
        }
    }

    // Get current mode info
    const currentMode = MODES.find(m => m.id === selectedMode) || null

    // ========== RENDER: Mode Selection (no active conversation) ==========
    if (!selectedMode) {
        return (
            <div className="chat-container">
                <div className="chat-top-bar">
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setShowHistory(true)}
                        title="Historial de conversaciones"
                    >
                        <Clock size={16} />
                        <span>Historial</span>
                    </button>
                </div>

                <ModeSelector onSelectMode={handleSelectMode} />

                <ChatHistory
                    userId={profile?.id}
                    onSelectConversation={loadConversation}
                    onClose={() => setShowHistory(false)}
                    visible={showHistory}
                />
            </div>
        )
    }

    // ========== RENDER: Active Chat ==========
    return (
        <div className="chat-container">
            {/* Top bar with mode indicator and actions */}
            <div className="chat-top-bar">
                <div className="chat-top-left">
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={handleNewConversation}
                        title="Nueva conversación"
                    >
                        <Plus size={16} />
                        <span>Nuevo</span>
                    </button>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setShowHistory(true)}
                        title="Historial"
                    >
                        <Clock size={16} />
                    </button>
                </div>

                {currentMode && (
                    <div className="chat-mode-indicator" style={{ '--mode-color': currentMode.color }}>
                        <span className="chat-mode-emoji">{currentMode.emoji}</span>
                        <span className="chat-mode-label">{currentMode.label}</span>
                    </div>
                )}

                {messages.length > 0 && (
                    <span className="chat-msg-count">{messages.length} msgs</span>
                )}
            </div>

            {/* Messages area */}
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon" style={{ background: `linear-gradient(135deg, ${currentMode?.color || '#7c3aed'}, ${currentMode?.color || '#7c3aed'}99)` }}>
                            <Sparkles size={32} color="white" />
                        </div>
                        <h2>{currentMode?.emoji} {currentMode?.label}</h2>
                        <p>{currentMode?.description}</p>
                        <span className="chat-welcome-hint">Contame, ¿qué te trae por acá hoy?</span>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i}>
                            <div className={`message-row ${msg.role}`}>
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

                            {/* Inline recommendation card */}
                            {msg.role === 'ai' && msg.analysis?.recomendacion && (
                                <RecommendationCard
                                    recomendacion={msg.analysis.recomendacion}
                                    onAccept={handleAcceptRecommendation}
                                />
                            )}
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

            {/* Input area */}
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

            {/* Confetti celebration */}
            <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Chat history panel */}
            <ChatHistory
                userId={profile?.id}
                onSelectConversation={loadConversation}
                onClose={() => setShowHistory(false)}
                visible={showHistory}
            />
        </div>
    )
}
