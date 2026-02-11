import { Brain } from 'lucide-react'

const voces = [
    {
        id: 'nino',
        nombre: 'El Niño Pequeño',
        emoji: '🌧️',
        clase: 'nino',
        descripcion: 'Voz de victimización, lástima propia, impotencia. Busca protección mediante la evitación. Genera parálisis por miedo al fracaso.',
        patron: 'Aparece en contextos de vulnerabilidad, relaciones, y cuando se siente solo o abrumado.',
        mensajes: [
            'No puedo hacerlo',
            'Qué mal la paso',
            'Por qué son así conmigo'
        ]
    },
    {
        id: 'sargento',
        nombre: 'El Sargento',
        emoji: '📢',
        clase: 'sargento',
        descripcion: 'Voz hipercrítica, exigente, minimiza logros y maximiza deficiencias. Intenta motivar mediante crítica pero sabotea autoestima.',
        patron: 'Se activa especialmente DESPUÉS de logros, recontextualizándolos como insuficientes o tardíos.',
        mensajes: [
            'Viste que no podés',
            'Lo hubieses hecho mejor',
            'Por qué no lo hiciste antes',
            'Si hubieses empezado antes ahora tendrías tremendo físico'
        ]
    },
    {
        id: 'adulto',
        nombre: 'El Adulto Responsable',
        emoji: '🛡️',
        clase: 'adulto',
        descripcion: 'Voz emergente, en construcción. Validador, realista, compasivo sin lástima, exigente sin ser destructivo.',
        patron: 'NO es solo diálogo interno. Es ACCIÓN: hacer cosas que las otras dos voces no quieren pero que son necesarias.',
        mensajes: [
            'Hice lo que tenía que hacer',
            'No fue perfecto, pero avancé',
            'Puedo mejorar sin destruirme',
            'Está bien sentir esto, pero no me define'
        ]
    }
]

const identidad = {
    fisico: {
        titulo: 'Físico',
        descripcion: 'Postura recta, mirada segura, tono de voz seguro. 1.64m con buena masa muscular. Ejercicio diario combinando cardio y pesas.',
        nota: 'El físico no es vanidad, es parte de la construcción de identidad y seguridad.'
    },
    autoestima: {
        titulo: 'Autoestima y Seguridad',
        descripcion: 'Se siente a gusto con su propia compañía. Suelta personas que no suman sin entrar en crisis. Criterio: "esto o mejor". Habla con seguridad, voz firme.',
    },
    emocional: {
        titulo: 'Estado Emocional',
        descripcion: 'Felicidad con orgullo (no éxtasis). Calma con el pasado. Satisfecho con el presente. Los momentos malos duelen pero los acepta.',
        principio: 'No vive con "y si...". Acepta batallas que valen la pena, deja las que no valen su tiempo.'
    },
    accion: {
        titulo: 'Acción',
        descripcion: 'Hace lo que tiene que hacer tenga ganas o no. No se bloquea por fiaca, vergüenza ni sobrepensamiento.',
    },
    introspeccion: {
        titulo: 'Introspección',
        descripcion: 'La usa como arma para saber qué le falta para mejorar, como templo interior de calma, compañía y gratitud. NUNCA como castigo o culpa.',
    }
}

export default function EstructurasPage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Estructuras Internas</h1>
                <p className="page-subtitle">Las tres voces y la identidad del Adulto Responsable que estás construyendo</p>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
                🎭 Las Tres Voces
            </h2>

            <div className="card-grid" style={{ marginBottom: 32 }}>
                {voces.map(voz => (
                    <div key={voz.id} className={`card voice-card ${voz.clase}`}>
                        <div className="voice-card-header">
                            <div className="voice-card-icon">{voz.emoji}</div>
                            <div>
                                <h3 className="card-title">{voz.nombre}</h3>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 8, lineHeight: 1.6 }}>
                            {voz.descripcion}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 8, fontStyle: 'italic' }}>
                            📌 {voz.patron}
                        </p>
                        <div className="voice-messages" style={{ marginTop: 12 }}>
                            {voz.mensajes.map((msg, i) => (
                                <div key={i} className="voice-message">"{msg}"</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
                🏗️ Identidad del Adulto Responsable en Construcción
            </h2>

            <div className="card-grid">
                {Object.values(identidad).map((item, i) => (
                    <div key={i} className="card">
                        <h3 className="card-title" style={{ marginBottom: 8 }}>{item.titulo}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {item.descripcion}
                        </p>
                        {item.nota && (
                            <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
                                ⚡ {item.nota}
                            </p>
                        )}
                        {item.principio && (
                            <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>
                                💡 {item.principio}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
