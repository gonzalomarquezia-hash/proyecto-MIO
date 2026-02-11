import { useState, useEffect } from 'react'
import { Repeat, Plus, Flame, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react'
import { getHabitos, createHabito, updateHabito, deleteHabito, getMetas } from '../services/supabase'

const emptyHabito = {
    nombre: '',
    meta_id: '',
    frecuencia: 'diario',
    hora_recordatorio: '15:00',
    mensaje_recordatorio: '',
    activo: true
}

export default function HabitosPage({ profile }) {
    const [habitos, setHabitos] = useState([])
    const [metas, setMetas] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ ...emptyHabito })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.id) loadData()
    }, [profile])

    async function loadData() {
        setLoading(true)
        const [h, m] = await Promise.all([
            getHabitos(profile.id),
            getMetas(profile.id)
        ])
        setHabitos(h)
        setMetas(m.filter(mt => mt.estado === 'activa'))
        setLoading(false)
    }

    function openCreate() {
        setForm({ ...emptyHabito })
        setEditing(null)
        setShowModal(true)
    }

    function openEdit(habito) {
        setForm({
            nombre: habito.nombre,
            meta_id: habito.meta_id || '',
            frecuencia: habito.frecuencia || 'diario',
            hora_recordatorio: habito.hora_recordatorio || '15:00',
            mensaje_recordatorio: habito.mensaje_recordatorio || '',
            activo: habito.activo
        })
        setEditing(habito.id)
        setShowModal(true)
    }

    async function handleSave() {
        if (!form.nombre.trim()) return
        const payload = { ...form, user_id: profile.id }
        if (!payload.meta_id) payload.meta_id = null

        if (editing) {
            delete payload.user_id
            await updateHabito(editing, payload)
        } else {
            await createHabito(payload)
        }
        setShowModal(false)
        loadData()
    }

    async function handleDelete(id) {
        if (confirm('¿Seguro que querés eliminar este hábito?')) {
            await deleteHabito(id)
            loadData()
        }
    }

    async function toggleActive(habito) {
        await updateHabito(habito.id, { activo: !habito.activo })
        loadData()
    }

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Hábitos y Actividades</h1>
                    <p className="page-subtitle">Tus rutinas y su seguimiento conversacional</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={18} /> Nuevo hábito
                </button>
            </div>

            {loading ? (
                <div className="empty-state"><p>Cargando...</p></div>
            ) : habitos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Repeat size={28} /></div>
                    <h3>Sin hábitos aún</h3>
                    <p>Creá un hábito vinculado a tus metas para empezar a construir rutinas.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>
                        <Plus size={16} /> Crear hábito
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {habitos.map(h => (
                        <div key={h.id} className="card" style={{ opacity: h.activo ? 1 : 0.6 }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 size={18} color={h.activo ? 'var(--success)' : 'var(--text-muted)'} />
                                    <span className={`badge ${h.activo ? 'activa' : 'pausada'}`}>
                                        {h.activo ? 'Activo' : 'Pausado'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn-icon" onClick={() => toggleActive(h)} title={h.activo ? 'Pausar' : 'Activar'}>
                                        {h.activo ? '⏸' : '▶️'}
                                    </button>
                                    <button className="btn-icon" onClick={() => openEdit(h)} title="Editar"><Edit3 size={14} /></button>
                                    <button className="btn-icon" onClick={() => handleDelete(h.id)} title="Eliminar"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <h3 className="card-title">{h.nombre}</h3>
                            {h.metas?.titulo && (
                                <p className="card-subtitle" style={{ marginTop: 4 }}>🎯 Meta: {h.metas.titulo}</p>
                            )}

                            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                                <span>📅 {h.frecuencia}</span>
                                {h.hora_recordatorio && <span>⏰ {h.hora_recordatorio?.slice(0, 5)}</span>}
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13 }}>
                                <div className="streak-display">
                                    <Flame size={16} /> {h.racha_actual} días
                                </div>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Récord: {h.racha_maxima} días
                                </span>
                            </div>

                            {h.mensaje_recordatorio && (
                                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    "{h.mensaje_recordatorio}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editing ? 'Editar hábito' : 'Nuevo hábito'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Meditar, Ir al gimnasio..." />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Meta vinculada (opcional)</label>
                            <select className="form-select" value={form.meta_id} onChange={e => setForm({ ...form, meta_id: e.target.value })}>
                                <option value="">Sin meta vinculada</option>
                                {metas.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Frecuencia</label>
                                <select className="form-select" value={form.frecuencia} onChange={e => setForm({ ...form, frecuencia: e.target.value })}>
                                    <option value="diario">Diario</option>
                                    <option value="lunes_miercoles_viernes">Lun/Mié/Vie</option>
                                    <option value="fines_de_semana">Fines de semana</option>
                                    <option value="personalizado">Personalizado</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hora recordatorio</label>
                                <input className="form-input" type="time" value={form.hora_recordatorio} onChange={e => setForm({ ...form, hora_recordatorio: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mensaje del recordatorio</label>
                            <input className="form-input" value={form.mensaje_recordatorio} onChange={e => setForm({ ...form, mensaje_recordatorio: e.target.value })} placeholder="Ej: ¿Pudiste meditar hoy?" />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
