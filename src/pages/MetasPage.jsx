import { useState, useEffect } from 'react'
import { Target, Plus, Edit3, Trash2, X } from 'lucide-react'
import { getMetas, createMeta, updateMeta, deleteMeta } from '../services/supabase'

const categorias = [
    { value: 'fisico', label: 'Físico' },
    { value: 'emocional', label: 'Emocional' },
    { value: 'profesional', label: 'Profesional' },
    { value: 'relacional', label: 'Relacional' },
    { value: 'academico', label: 'Académico' },
    { value: 'personal', label: 'Personal' },
]

const estados = [
    { value: 'activa', label: 'Activa' },
    { value: 'pausada', label: 'Pausada' },
    { value: 'completada', label: 'Completada' },
    { value: 'abandonada', label: 'Abandonada' },
]

const emptyMeta = {
    titulo: '',
    descripcion: '',
    categoria: 'personal',
    estado: 'activa',
    fecha_limite: '',
    progreso_porcentaje: 0,
    notas_progreso: ''
}

export default function MetasPage({ profile }) {
    const [metas, setMetas] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ ...emptyMeta })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.id) loadMetas()
    }, [profile])

    async function loadMetas() {
        setLoading(true)
        const data = await getMetas(profile.id)
        setMetas(data)
        setLoading(false)
    }

    function openCreate() {
        setForm({ ...emptyMeta })
        setEditing(null)
        setShowModal(true)
    }

    function openEdit(meta) {
        setForm({
            titulo: meta.titulo,
            descripcion: meta.descripcion || '',
            categoria: meta.categoria || 'personal',
            estado: meta.estado || 'activa',
            fecha_limite: meta.fecha_limite || '',
            progreso_porcentaje: meta.progreso_porcentaje || 0,
            notas_progreso: meta.notas_progreso || ''
        })
        setEditing(meta.id)
        setShowModal(true)
    }

    async function handleSave() {
        if (!form.titulo.trim()) return
        const payload = { ...form, user_id: profile.id }
        if (!payload.fecha_limite) delete payload.fecha_limite

        if (editing) {
            delete payload.user_id
            await updateMeta(editing, payload)
        } else {
            await createMeta(payload)
        }
        setShowModal(false)
        loadMetas()
    }

    async function handleDelete(id) {
        if (confirm('¿Seguro que querés eliminar esta meta?')) {
            await deleteMeta(id)
            loadMetas()
        }
    }

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Metas</h1>
                    <p className="page-subtitle">Tus objetivos y el progreso hacia ellos</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={18} /> Nueva meta
                </button>
            </div>

            {loading ? (
                <div className="empty-state">
                    <p>Cargando...</p>
                </div>
            ) : metas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Target size={28} /></div>
                    <h3>Sin metas aún</h3>
                    <p>Creá tu primera meta para empezar a dar forma a lo que querés lograr.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>
                        <Plus size={16} /> Crear meta
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {metas.map(meta => (
                        <div key={meta.id} className="card">
                            <div className="card-header">
                                <div>
                                    <span className={`badge ${meta.categoria}`}>{categorias.find(c => c.value === meta.categoria)?.label || meta.categoria}</span>
                                    <span className={`badge ${meta.estado}`} style={{ marginLeft: 6 }}>{estados.find(e => e.value === meta.estado)?.label || meta.estado}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn-icon" onClick={() => openEdit(meta)} title="Editar">
                                        <Edit3 size={14} />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleDelete(meta.id)} title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="card-title">{meta.titulo}</h3>
                            {meta.descripcion && <p className="card-subtitle">{meta.descripcion}</p>}
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${meta.progreso_porcentaje}%` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                                <span>{meta.progreso_porcentaje}% completado</span>
                                {meta.fecha_limite && <span>Límite: {new Date(meta.fecha_limite).toLocaleDateString('es-AR')}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editing ? 'Editar meta' : 'Nueva meta'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Título</label>
                            <input className="form-input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Ganar masa muscular" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea className="form-textarea" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle de la meta..." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Categoría</label>
                                <select className="form-select" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                                    {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estado</label>
                                <select className="form-select" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                                    {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Fecha límite</label>
                                <input className="form-input" type="date" value={form.fecha_limite} onChange={e => setForm({ ...form, fecha_limite: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Progreso ({form.progreso_porcentaje}%)</label>
                                <input type="range" min="0" max="100" value={form.progreso_porcentaje} onChange={e => setForm({ ...form, progreso_porcentaje: parseInt(e.target.value) })} style={{ marginTop: 8 }} />
                            </div>
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
