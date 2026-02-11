import { Settings, Database, Key, Bell, Download } from 'lucide-react'

export default function ConfigPage({ profile }) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Configuración</h1>
                <p className="page-subtitle">Estado del sistema y configuraciones</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                {/* Connection status */}
                <div className="card">
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Database size={18} /> Estado de Conexiones
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14 }}>Supabase</span>
                            <span className={`badge ${supabaseUrl ? 'activa' : 'abandonada'}`}>
                                {supabaseUrl ? '✓ Conectado' : '✗ No configurado'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14 }}>Gemini 2.5 Pro</span>
                            <span className={`badge ${hasGeminiKey ? 'activa' : 'pausada'}`}>
                                {hasGeminiKey ? '✓ Configurado' : '⚠ Pendiente (agregar en .env)'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14 }}>Perfil de usuario</span>
                            <span className={`badge ${profile ? 'activa' : 'pausada'}`}>
                                {profile ? `✓ ${profile.nombre}` : '⚠ No encontrado'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* API Key instructions */}
                {!hasGeminiKey && (
                    <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--warning)' }}>
                            <Key size={18} /> Configurar API Key de Gemini
                        </h3>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <p>Para activar el chat con IA, necesitás una API Key de Gemini:</p>
                            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
                                <li>Andá a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: 'var(--secondary-light)' }}>Google AI Studio</a></li>
                                <li>Creá o copiá tu API Key</li>
                                <li>Abrí el archivo <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>.env</code> en la raíz del proyecto</li>
                                <li>Pegala en <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>VITE_GEMINI_API_KEY=tu_key_aquí</code></li>
                                <li>Reiniciá el servidor de desarrollo</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Notifications (coming soon) */}
                <div className="card" style={{ opacity: 0.6 }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Bell size={18} /> Notificaciones
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        🚧 Disponible en Fase 2 — Recordatorios de hábitos, check-ins emocionales y cierre del día configurables.
                    </p>
                </div>

                {/* Export (coming soon) */}
                <div className="card" style={{ opacity: 0.6 }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Download size={18} /> Exportación de datos
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        🚧 Disponible en Fase 2 — Exportar datos para tu psicólogo en PDF o resumen narrativo.
                    </p>
                </div>

                {/* App info */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 8 }}>Acerca de Conciencia</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        <p><strong>Versión:</strong> 1.0 MVP</p>
                        <p><strong>Stack:</strong> React + Supabase + Gemini 2.5 Pro</p>
                        <p style={{ marginTop: 8, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "Mi objetivo es que cada vez me necesites menos."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
