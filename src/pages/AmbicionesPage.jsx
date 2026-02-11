import { useState } from 'react'
import { Star, Plus, X, Edit3, Trash2, Save } from 'lucide-react'
import { updateProfile } from '../services/supabase'

export default function AmbicionesPage({ profile, onUpdate }) {
    const [showAdd, setShowAdd] = useState(false)
    const [newAmbicion, setNewAmbicion] = useState('')
    const [editing, setEditing] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)

    const ambiciones = profile?.ambiciones || []

    async function handleAdd() {
        if (!newAmbicion.trim()) return
        setSaving(true)
        const updated = [...ambiciones, newAmbicion.trim()]
        await updateProfile(profile.id, { ambiciones: updated })
        await onUpdate()
        setNewAmbicion('')
        setShowAdd(false)
        setSaving(false)
    }

    async function handleDelete(index) {
        if (!confirm('¿Seguro?')) return
        setSaving(true)
        const updated = ambiciones.filter((_, i) => i !== index)
        await updateProfile(profile.id, { ambiciones: updated })
        await onUpdate()
        setSaving(false)
    }

    async function handleEdit(index) {
        if (!editValue.trim()) return
        setSaving(true)
        const updated = [...ambiciones]
        updated[index] = editValue.trim()
        await updateProfile(profile.id, { ambiciones: updated })
        await onUpdate()
        setEditing(null)
        setSaving(false)
    }

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Ambiciones</h1>
                    <p className="page-subtitle">Tu visión de largo plazo, tus sueños, hacia dónde vas</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={18} /> Agregar
                </button>
            </div>

            {showAdd && (
                <div className="card" style={{ maxWidth: 500, marginBottom: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Nueva ambición</label>
                        <input
                            className="form-input"
                            value={newAmbicion}
                            onChange={e => setNewAmbicion(e.target.value)}
                            placeholder="Ej: Tener mi propia empresa de tecnología"
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setNewAmbicion('') }}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>Agregar</button>
                    </div>
                </div>
            )}

            {ambiciones.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Star size={28} /></div>
                    <h3>Sin ambiciones definidas</h3>
                    <p>Definí las grandes cosas que querés lograr en tu vida. Esta visión guía tus metas y hábitos.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
                    {ambiciones.map((a, i) => (
                        <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <Star size={18} color="white" />
                            </div>
                            {editing === i ? (
                                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                                    <input
                                        className="form-input"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        style={{ flex: 1 }}
                                        onKeyDown={e => e.key === 'Enter' && handleEdit(i)}
                                        autoFocus
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(i)} disabled={saving}>
                                        <Save size={14} />
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{a}</span>
                                    <button className="btn-icon" onClick={() => { setEditing(i); setEditValue(a) }}>
                                        <Edit3 size={14} />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleDelete(i)}>
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
