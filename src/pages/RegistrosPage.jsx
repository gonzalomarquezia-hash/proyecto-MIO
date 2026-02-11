import { useState, useEffect } from 'react'
import { FileText, Search, ChevronDown, ChevronUp, Clock, Brain, MessageCircle, Lightbulb, AlertTriangle, Trash2 } from 'lucide-react'
import { getEmotionalRecords } from '../services/supabase'
import { supabase } from '../services/supabase'

const voiceConfig = {
    nino: { emoji: '🌧️', label: 'Niño', color: '#60a5fa' },
    sargento: { emoji: '📢', label: 'Sargento', color: '#ef4444' },
    adulto: { emoji: '🛡️', label: 'Adulto', color: '#34d399' },
    mixta: { emoji: '🔄', label: 'Mixta', color: '#f59e0b' },
    ninguna_dominante: { emoji: '💭', label: 'Neutral', color: '#a78bfa' }
}

function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

function formatTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// Deduplicate array (for emotions that might repeat)
function uniqueArray(arr) {
    if (!arr) return []
    return [...new Set(arr.map(s => s.toLowerCase()))]
}

// Group records by date
function groupByDate(records) {
    const groups = {}
    records.forEach(r => {
        const dateKey = new Date(r.created_at).toLocaleDateString('es-AR')
        if (!groups[dateKey]) {
            groups[dateKey] = { date: r.created_at, records: [] }
        }
        groups[dateKey].records.push(r)
    })
    return Object.values(groups)
}

export default function RegistrosPage({ profile }) {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedId, setExpandedId] = useState(null)
    const [filterVoice, setFilterVoice] = useState('todas')

    useEffect(() => {
        if (profile?.id) loadRecords()
    }, [profile])

    async function loadRecords() {
        setLoading(true)
        const data = await getEmotionalRecords(profile.id, 200)
        setRecords(data)
        setLoading(false)
    }

    async function handleDelete(e, recordId) {
        e.stopPropagation() // Don't toggle expand
        if (!window.confirm('¿Eliminar este registro?')) return

        const { error } = await supabase
            .from('registros_emocionales')
            .delete()
            .eq('id', recordId)

        if (error) {
            console.error('Error deleting record:', error)
            return
        }

        setRecords(prev => prev.filter(r => r.id !== recordId))
        if (expandedId === recordId) setExpandedId(null)
    }

    // Filter records
    const filtered = records.filter(r => {
        const matchesSearch = !searchTerm ||
            r.mensaje_raw?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.respuesta_ia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.contexto?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesVoice = filterVoice === 'todas' || r.voz_identificada === filterVoice
        return matchesSearch && matchesVoice
    })

    const grouped = groupByDate(filtered)

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">📋 Registros Emocionales</h1>
                <p className="page-subtitle">
                    Tu diario emocional automático — cada conversación queda registrada acá
                </p>
            </div>

            {/* Filters bar */}
            <div className="registros-filters">
                <div className="registros-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar en tus registros..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="form-input"
                    />
                </div>
                <select
                    className="form-select"
                    value={filterVoice}
                    onChange={e => setFilterVoice(e.target.value)}
                >
                    <option value="todas">Todas las voces</option>
                    <option value="nino">🌧️ Niño</option>
                    <option value="sargento">📢 Sargento</option>
                    <option value="adulto">🛡️ Adulto</option>
                    <option value="mixta">🔄 Mixta</option>
                    <option value="ninguna_dominante">💭 Neutral</option>
                </select>
                <span className="registros-count">{filtered.length} registros</span>
            </div>

            {/* Records list */}
            {loading ? (
                <div className="empty-state">
                    <div className="typing-indicator" style={{ padding: 20 }}>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                    </div>
                    <p>Cargando registros...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FileText size={28} />
                    </div>
                    <h3>{searchTerm ? 'Sin resultados' : 'Todavía no hay registros'}</h3>
                    <p>
                        {searchTerm
                            ? 'Probá con otro término de búsqueda'
                            : 'Cuando chatees con Conciencia, cada intercambio se va a guardar acá automáticamente'
                        }
                    </p>
                </div>
            ) : (
                <div className="registros-timeline">
                    {grouped.map((group, gi) => (
                        <div key={gi} className="registros-day-group">
                            <div className="registros-day-header">
                                <span className="registros-day-date">{formatDate(group.date)}</span>
                                <span className="registros-day-count">{group.records.length} entradas</span>
                            </div>

                            {group.records.map(record => {
                                const voice = voiceConfig[record.voz_identificada] || voiceConfig.ninguna_dominante
                                const isExpanded = expandedId === record.id
                                const emotions = uniqueArray(record.estado_emocional)

                                return (
                                    <div
                                        key={record.id}
                                        className={`registro-card ${isExpanded ? 'expanded' : ''}`}
                                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                    >
                                        <div className="registro-content">
                                            {/* Header row */}
                                            <div className="registro-header">
                                                <div className="registro-header-left">
                                                    <span className="registro-time">
                                                        <Clock size={13} />
                                                        {formatTime(record.created_at)}
                                                    </span>
                                                    <span
                                                        className="registro-voice-badge"
                                                        style={{
                                                            background: voice.color + '20',
                                                            color: voice.color
                                                        }}
                                                    >
                                                        {voice.emoji} {voice.label}
                                                    </span>
                                                    {emotions.map((emo, j) => (
                                                        <span key={j} className="emotion-tag">{emo}</span>
                                                    ))}
                                                    {record.intensidad_emocional > 0 && (
                                                        <span className="registro-intensity">
                                                            {record.intensidad_emocional}/100
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="registro-header-actions">
                                                    <button
                                                        className="registro-delete-btn"
                                                        onClick={(e) => handleDelete(e, record.id)}
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className="registro-expand-icon">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User message preview */}
                                            <div className="registro-message">
                                                <MessageCircle size={14} />
                                                <p>{record.mensaje_raw}</p>
                                            </div>

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div className="registro-details">
                                                    {/* AI Response */}
                                                    {record.respuesta_ia && (
                                                        <div className="registro-detail-block">
                                                            <div className="registro-detail-label">
                                                                <Brain size={14} /> Respuesta de Conciencia
                                                            </div>
                                                            <p className="registro-detail-text ai-response">
                                                                {record.respuesta_ia}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Context */}
                                                    {record.contexto && (
                                                        <div className="registro-detail-block">
                                                            <div className="registro-detail-label">
                                                                <FileText size={14} /> Contexto
                                                            </div>
                                                            <p className="registro-detail-text">{record.contexto}</p>
                                                        </div>
                                                    )}

                                                    {/* Automatic thought */}
                                                    {record.pensamiento_automatico && (
                                                        <div className="registro-detail-block">
                                                            <div className="registro-detail-label">
                                                                <AlertTriangle size={14} /> Pensamiento automático
                                                            </div>
                                                            <p className="registro-detail-text distortion">
                                                                "{record.pensamiento_automatico}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Cognitive distortions */}
                                                    {record.distorsion_cognitiva?.length > 0 && (
                                                        <div className="registro-detail-block">
                                                            <div className="registro-detail-label">
                                                                <AlertTriangle size={14} /> Distorsiones cognitivas
                                                            </div>
                                                            <div className="registro-distortions">
                                                                {record.distorsion_cognitiva.map((d, k) => (
                                                                    <span key={k} className="distortion-tag">{d}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Alternative thought */}
                                                    {record.pensamiento_alternativo && (
                                                        <div className="registro-detail-block">
                                                            <div className="registro-detail-label">
                                                                <Lightbulb size={14} /> Pensamiento alternativo
                                                            </div>
                                                            <p className="registro-detail-text alternative">
                                                                "{record.pensamiento_alternativo}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
