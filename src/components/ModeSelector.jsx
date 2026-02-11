import { Headphones, Brain, Zap } from 'lucide-react'

const MODES = [
    {
        id: 'escucha',
        label: 'Diario Personal',
        subtitle: 'Desahogarte',
        icon: Headphones,
        color: '#60a5fa',
        description: 'Un espacio seguro para expresarte sin filtro. Acá nadie te juzga ni te da consejos que no pediste. Solo te escucho, te valido y te acompaño. Ideal para anotar cómo te sentís, desahogarte o simplemente soltar.',
        emoji: '👂'
    },
    {
        id: 'reflexion',
        label: 'Conocerte Más',
        subtitle: 'Entenderte',
        icon: Brain,
        color: '#a78bfa',
        description: 'Exploramos juntos qué hay detrás de lo que sentís. Con preguntas, no con respuestas. Identificamos patrones, voces internas y creencias que quizás no sabías que tenías. Terapia cognitiva pero como charla entre amigos.',
        emoji: '🧠'
    },
    {
        id: 'accion',
        label: 'Tomar Acción',
        subtitle: 'Avanzar',
        icon: Zap,
        color: '#f59e0b',
        description: 'Pasamos de pensar a hacer. Te ayudo a armar pasos concretos, micro-metas y planes reales. Sin presión, a tu ritmo. Si sentís que estás trabado, acá rompemos ese bloqueo juntos.',
        emoji: '🔥'
    }
]

export default function ModeSelector({ onSelectMode, compact = false }) {
    if (compact) {
        return (
            <div className="mode-selector-compact">
                {MODES.map(mode => (
                    <button
                        key={mode.id}
                        className="mode-pill"
                        onClick={() => onSelectMode(mode.id)}
                        style={{ '--mode-color': mode.color }}
                        title={mode.description}
                    >
                        <mode.icon size={14} />
                        <span>{mode.label}</span>
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className="mode-selector">
            <div className="mode-selector-header">
                <h2>¿Qué necesitás hoy?</h2>
                <p>Elegí cómo querés que te acompañe</p>
            </div>
            <div className="mode-cards">
                {MODES.map(mode => (
                    <button
                        key={mode.id}
                        className="mode-card"
                        onClick={() => onSelectMode(mode.id)}
                        style={{ '--mode-color': mode.color }}
                    >
                        <div className="mode-card-icon">
                            <mode.icon size={28} />
                        </div>
                        <div className="mode-card-content">
                            <span className="mode-card-emoji">{mode.emoji}</span>
                            <h3>{mode.label}</h3>
                            <span className="mode-card-subtitle">{mode.subtitle}</span>
                            <p>{mode.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export { MODES }
