import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Activity } from 'lucide-react'
import { getEmotionalRecords } from '../services/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'

const VOICE_COLORS = {
    nino: '#60a5fa',
    sargento: '#ef4444',
    adulto: '#34d399',
    mixta: '#f59e0b',
    ninguna_dominante: '#6b6b8a'
}

const VOICE_LABELS = {
    nino: 'Niño',
    sargento: 'Sargento',
    adulto: 'Adulto',
    mixta: 'Mixta',
    ninguna_dominante: 'N/D'
}

export default function GraficosPage({ profile }) {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.id) loadRecords()
    }, [profile])

    async function loadRecords() {
        setLoading(true)
        const data = await getEmotionalRecords(profile.id, 200)
        setRecords(data)
        setLoading(false)
    }

    // Process voice distribution
    const voiceData = Object.entries(
        records.reduce((acc, r) => {
            const v = r.voz_identificada || 'ninguna_dominante'
            acc[v] = (acc[v] || 0) + 1
            return acc
        }, {})
    ).map(([name, value]) => ({
        name: VOICE_LABELS[name] || name,
        value,
        fill: VOICE_COLORS[name] || '#6b6b8a'
    }))

    // Process emotions distribution
    const emotionCounts = {}
    records.forEach(r => {
        (r.estado_emocional || []).forEach(e => {
            emotionCounts[e] = (emotionCounts[e] || 0) + 1
        })
    })
    const emotionData = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))

    // Process intensity over time
    const intensityByDate = {}
    records.forEach(r => {
        const date = r.fecha || r.created_at?.split('T')[0]
        if (date && r.intensidad_emocional != null) {
            if (!intensityByDate[date]) intensityByDate[date] = { sum: 0, count: 0 }
            intensityByDate[date].sum += r.intensidad_emocional
            intensityByDate[date].count += 1
        }
    })
    const intensityData = Object.entries(intensityByDate)
        .sort()
        .slice(-30)
        .map(([date, val]) => ({
            date: new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            intensidad: Math.round(val.sum / val.count)
        }))

    // Restructuring effectiveness
    const restructuringRecords = records.filter(r =>
        r.intensidad_emocional != null && r.intensidad_post_reestructuracion != null
    )
    const avgPre = restructuringRecords.length > 0
        ? Math.round(restructuringRecords.reduce((s, r) => s + r.intensidad_emocional, 0) / restructuringRecords.length)
        : 0
    const avgPost = restructuringRecords.length > 0
        ? Math.round(restructuringRecords.reduce((s, r) => s + r.intensidad_post_reestructuracion, 0) / restructuringRecords.length)
        : 0

    const customTooltipStyle = {
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: 'var(--text-primary)',
        fontSize: '13px'
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="empty-state"><p>Cargando datos...</p></div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Gráficos y Datos</h1>
                <p className="page-subtitle">Visualización de tu proceso emocional y terapéutico</p>
            </div>

            {records.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><BarChart3 size={28} /></div>
                    <h3>Sin datos aún</h3>
                    <p>Empezá a usar el chat para que aparezcan tus gráficos. Cada conversación genera datos.</p>
                </div>
            ) : (
                <>
                    {/* Stats summary */}
                    <div className="card-grid" style={{ marginBottom: 24 }}>
                        <div className="card">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.15)' }}>
                                    <Activity size={24} color="var(--secondary-light)" />
                                </div>
                                <div>
                                    <div className="stat-value">{records.length}</div>
                                    <div className="stat-label">Registros totales</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.15)' }}>
                                    <TrendingUp size={24} color="var(--success)" />
                                </div>
                                <div>
                                    <div className="stat-value">{voiceData.find(v => v.name === 'Adulto')?.value || 0}</div>
                                    <div className="stat-label">Veces que habló el Adulto</div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                                    <BarChart3 size={24} color="var(--warning)" />
                                </div>
                                <div>
                                    <div className="stat-value">{restructuringRecords.length}</div>
                                    <div className="stat-label">Reestructuraciones cognitivas</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="card-grid">
                        {/* Voice distribution */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: 8 }}>Distribución de Voces</h3>
                            <p className="card-subtitle">¿Quién habla más seguido?</p>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={voiceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {voiceData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={customTooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Emotions */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: 8 }}>Emociones Predominantes</h3>
                            <p className="card-subtitle">Las emociones más frecuentes en tus registros</p>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={emotionData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                        <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} width={100} />
                                        <Tooltip contentStyle={customTooltipStyle} />
                                        <Bar dataKey="value" fill="var(--secondary)" radius={[0, 4, 4, 0]} name="Frecuencia" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Intensity over time */}
                        {intensityData.length > 1 && (
                            <div className="card" style={{ gridColumn: '1 / -1' }}>
                                <h3 className="card-title" style={{ marginBottom: 8 }}>Intensidad Emocional en el Tiempo</h3>
                                <p className="card-subtitle">Promedio diario de intensidad emocional (0-100)</p>
                                <div className="chart-container" style={{ height: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={intensityData}>
                                            <defs>
                                                <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                                            <Tooltip contentStyle={customTooltipStyle} />
                                            <Area type="monotone" dataKey="intensidad" stroke="var(--secondary)" fill="url(#colorIntensity)" strokeWidth={2} name="Intensidad" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Restructuring effectiveness */}
                        {restructuringRecords.length > 0 && (
                            <div className="card">
                                <h3 className="card-title" style={{ marginBottom: 8 }}>Eficacia de Reestructuración</h3>
                                <p className="card-subtitle">Intensidad emocional antes vs después</p>
                                <div style={{ display: 'flex', gap: 24, justifyContent: 'center', padding: '32px 0' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--danger)' }}>{avgPre}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Antes</div>
                                    </div>
                                    <div style={{ fontSize: 32, color: 'var(--text-muted)', alignSelf: 'center' }}>→</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--success)' }}>{avgPost}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Después</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--success)' }}>
                                    ↓ Reducción promedio de {avgPre - avgPost} puntos
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
