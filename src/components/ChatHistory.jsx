import { useState, useEffect } from 'react'
import { Clock, MessageCircle, X } from 'lucide-react'
import { MODES } from './ModeSelector'
import { getConversaciones } from '../services/supabase'

function timeAgo(date) {
    const now = new Date()
    const diff = now - new Date(date)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
}

export default function ChatHistory({ userId, onSelectConversation, onClose, visible }) {
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (visible && userId) {
            loadConversations()
        }
    }, [visible, userId])

    async function loadConversations() {
        setLoading(true)
        const data = await getConversaciones(userId)
        setConversations(data)
        setLoading(false)
    }

    if (!visible) return null

    return (
        <div className="chat-history-overlay" onClick={onClose}>
            <div className="chat-history-panel" onClick={e => e.stopPropagation()}>
                <div className="chat-history-header">
                    <h3><Clock size={18} /> Mis conversaciones</h3>
                    <button className="chat-history-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="chat-history-list">
                    {loading ? (
                        <div className="chat-history-empty">Cargando...</div>
                    ) : conversations.length === 0 ? (
                        <div className="chat-history-empty">
                            <MessageCircle size={24} />
                            <p>Todavía no tenés conversaciones</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const mode = MODES.find(m => m.id === conv.modo) || MODES[0]
                            return (
                                <button
                                    key={conv.id}
                                    className="chat-history-item"
                                    onClick={() => onSelectConversation(conv)}
                                    style={{ '--mode-color': mode.color }}
                                >
                                    <div className="chat-history-item-icon">
                                        {mode.emoji}
                                    </div>
                                    <div className="chat-history-item-content">
                                        <span className="chat-history-item-title">
                                            {conv.titulo || 'Conversación sin título'}
                                        </span>
                                        {conv.descripcion_breve && (
                                            <span className="chat-history-item-desc">
                                                {conv.descripcion_breve}
                                            </span>
                                        )}
                                        <span className="chat-history-item-meta">
                                            {mode.label} · {timeAgo(conv.updated_at)} · {conv.mensaje_count || 0} msgs
                                        </span>
                                    </div>
                                    {conv.recomendacion_modo && (
                                        <div className="chat-history-item-badge" title="Tiene sugerencia">
                                            💡
                                        </div>
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
