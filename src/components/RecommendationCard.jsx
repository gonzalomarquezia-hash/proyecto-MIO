import { ArrowRight } from 'lucide-react'
import { MODES } from './ModeSelector'

export default function RecommendationCard({ recomendacion, onAccept }) {
    if (!recomendacion || !recomendacion.modo_sugerido) return null

    const targetMode = MODES.find(m => m.id === recomendacion.modo_sugerido)
    if (!targetMode) return null

    return (
        <div className="recommendation-card" style={{ '--mode-color': targetMode.color }}>
            <div className="recommendation-header">
                <span className="recommendation-icon">💡</span>
                <span className="recommendation-label">Sugerencia</span>
            </div>
            <p className="recommendation-text">{recomendacion.motivo}</p>
            <button
                className="recommendation-btn"
                onClick={() => onAccept(recomendacion)}
            >
                <span>{targetMode.emoji} Ir a {targetMode.label}</span>
                <ArrowRight size={16} />
            </button>
        </div>
    )
}
