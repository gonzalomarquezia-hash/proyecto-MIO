import { useState } from 'react'
import { User, Ruler, Weight, Save } from 'lucide-react'
import { updateProfile } from '../services/supabase'

export default function PerfilPage({ profile, onUpdate }) {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        nombre: profile?.nombre || '',
        estatura_cm: profile?.estatura_cm || '',
        peso_kg: profile?.peso_kg || '',
    })
    const [saving, setSaving] = useState(false)

    if (!profile) {
        return (
            <div className="page-container">
                <div className="empty-state"><p>Cargando perfil...</p></div>
            </div>
        )
    }

    async function handleSave() {
        setSaving(true)
        await updateProfile(profile.id, {
            nombre: form.nombre,
            estatura_cm: form.estatura_cm ? parseInt(form.estatura_cm) : null,
            peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
        })
        await onUpdate()
        setEditing(false)
        setSaving(false)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Yo</h1>
                <p className="page-subtitle">Tu perfil personal</p>
            </div>

            <div className="card" style={{ maxWidth: 600 }}>
                <div className="profile-card-large">
                    <div className="profile-avatar-large">
                        {profile.nombre?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="profile-info">
                        <h2>{profile.nombre}</h2>
                        <div className="profile-stat">
                            <Ruler size={14} /> {profile.estatura_cm ? `${profile.estatura_cm} cm` : 'Sin estatura'}
                        </div>
                        <div className="profile-stat">
                            <Weight size={14} /> {profile.peso_kg ? `${profile.peso_kg} kg` : 'Sin peso'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ maxWidth: 600, marginTop: 16 }}>
                <div className="card-header">
                    <h3 className="card-title">Datos personales</h3>
                    {!editing && (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                            setForm({
                                nombre: profile.nombre || '',
                                estatura_cm: profile.estatura_cm || '',
                                peso_kg: profile.peso_kg || '',
                            })
                            setEditing(true)
                        }}>
                            Editar
                        </button>
                    )}
                </div>

                {editing ? (
                    <>
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Estatura (cm)</label>
                                <input className="form-input" type="number" value={form.estatura_cm} onChange={e => setForm({ ...form, estatura_cm: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Peso (kg)</label>
                                <input className="form-input" type="number" step="0.1" value={form.peso_kg} onChange={e => setForm({ ...form, peso_kg: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        <p><strong>Nombre:</strong> {profile.nombre}</p>
                        <p style={{ marginTop: 8 }}><strong>Estatura:</strong> {profile.estatura_cm ? `${profile.estatura_cm} cm` : '—'}</p>
                        <p style={{ marginTop: 8 }}><strong>Peso:</strong> {profile.peso_kg ? `${profile.peso_kg} kg` : '—'}</p>
                        <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                            Última actualización: {profile.datos_actualizados_at ? new Date(profile.datos_actualizados_at).toLocaleDateString('es-AR') : '—'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
