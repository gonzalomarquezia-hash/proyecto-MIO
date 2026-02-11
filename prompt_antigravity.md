# PROMPT PARA AGENTE GOOGLE ANTIGRAVITY
# Proyecto: Conciencia - Sistema de Acompañamiento Terapéutico Personal

---

## CONTEXTO DEL PROYECTO

Necesito que construyas una web app llamada "Conciencia" que funcione como un compañero terapéutico personal basado en IA. La app tiene una interfaz principal de chat (estilo ChatGPT/Gemini) con un sidebar lateral izquierdo con secciones adicionales.

**IMPORTANTE:** Antes de empezar a construir, leé el archivo adjunto `especificacion_sistema_terapeutico.json` que contiene TODA la especificación detallada del proyecto: perfil del usuario, voces internas, framework de TCC, esquema de base de datos, diseño visual, comportamiento del chat, y más. Ese archivo es tu fuente de verdad.

---

## QUÉ DEBE HACER ESTA APP

### 1. CHAT CONVERSACIONAL (Pantalla principal)
La app es un chatbot terapéutico que:

- **Recibe mensajes de texto** del usuario (fase 1, audio en fase 2)
- **Analiza cada mensaje** extrayendo: emociones detectadas (múltiples, no rígidas), voz interna activa (Niño/Sargento/Adulto), pensamiento automático, distorsión cognitiva (si hay), y contexto
- **Responde como el "Adulto Responsable"**: una voz empática, firme, validadora sin exagerar, realista sin ser destructiva. Habla en español argentino con voseo natural. NO es un terapeuta frío, es como un amigo cercano que te conoce y te ve desde afuera.
- **Aplica reestructuración cognitiva de TCC**: cuando detecta un pensamiento distorsionado, ofrece un pensamiento alternativo basado en DATOS REALES del historial del usuario almacenado en Supabase.
- **Hace preguntas de seguimiento**: "¿Cómo te sentís ahora?", "¿Qué creés que te ayudaría?", "¿Pudiste hacer algo que te haga bien?"
- **Guarda automáticamente** cada interacción codificada en la tabla `registros_emocionales` de Supabase

### 2. SISTEMA DE METAS Y HÁBITOS
- El usuario puede crear metas manualmente (ej: "Ganar masa muscular", "Lanzar agencia")
- Cada meta puede tener hábitos vinculados (ej: "Ir al gimnasio", "Meditar")
- Los hábitos tienen recordatorios configurables: hora + mensaje personalizado
- El seguimiento de hábitos es CONVERSACIONAL, no un simple checkbox:
  - Sistema: "Gonza, son las 15:00. ¿Pudiste meditar?"
  - Si respondió que sí: "¡Bien! ¿Cómo te sentiste antes, durante y después? ¿Te quedaste activo o te fuiste a descansar?"
  - Si respondió que no: Sin culpa. "No pasa nada. ¿Qué te frenó? ¿Querés intentarlo más tarde?"

### 3. NOTIFICACIONES/RECORDATORIOS
- Configurables manualmente por el usuario: hora, mensaje, días de la semana
- Tipos: recordatorio de hábito, check-in emocional ("¿Cómo venís hoy?"), cierre del día ("¿Qué lograste hacer hoy?")
- Tono: SIEMPRE invitación, NUNCA culpa ni exigencia
- Si no responde, no hay insistencia agresiva

### 4. DASHBOARD DE GRÁFICOS Y DATOS
Sección con visualizaciones que el usuario necesita VER para contrarrestar distorsiones cognitivas:
- **Emociones predominantes**: distribución temporal por semana/mes
- **Voz más presente**: frecuencia de Niño vs Sargento vs Adulto por período
- **Avance del Adulto Responsable**: no solo frecuencia de voz, también acciones realizadas a pesar de resistencia
- **Intensidad emocional**: tendencia en el tiempo
- **Eficacia de reestructuración**: comparativa intensidad pre vs post reestructuración
- **Rachas de hábitos**: calendario visual tipo GitHub contributions
- **Correlaciones**: qué actividades mejoran estado emocional

### 5. SECCIONES ADICIONALES DEL SIDEBAR
- **Yo**: Perfil personal (nombre, estatura, peso, foto)
- **Estructuras Internas**: Definición de las tres voces, la identidad del Adulto Responsable que está construyendo
- **Ambiciones**: Visión de largo plazo
- **Configuración**: Notificaciones, exportación de datos

---

## STACK TECNOLÓGICO

- **Frontend**: Web app responsive (PWA). HTML/CSS/JS o React.
- **Modelo IA**: Google Gemini 2.5 Pro para el procesamiento conversacional y análisis emocional
- **Base de datos**: Supabase (PostgreSQL). El esquema completo de tablas está en el JSON adjunto.
- **Audio (fase 2)**: Google Speech-to-Text o Whisper para transcribir audios

---

## DISEÑO VISUAL (CRÍTICO)

- **Tema**: Dark mode
- **Colores**: Azul profundo + violeta como primarios, gris oscuro de fondo, texto blanco/gris claro
- **Tipografía**: Sans-serif moderna y limpia (Inter, Outfit, o similar)
- **Estética**: Minimalista pero moderna. NO clínica, NO genérica, NO "app de hábitos estándar"
- **Las tres voces tienen iconografía propia**: Niño (suave, encogido), Sargento (angular, agresivo), Adulto (sólido, firme)
- **Feedback visual**: Animaciones sutiles al completar acciones, actualización de rachas, cambios de color

---

## PERSONALIDAD DEL CHATBOT (SYSTEM PROMPT PARA GEMINI)

Usá este system prompt para configurar el modelo de Gemini que maneja el chat:

```
Sos "Conciencia", el compañero terapéutico personal de Gonza. Actuás como la voz del Adulto Responsable que él está construyendo.

QUIÉN ES GONZA:
- Emprendedor argentino, dueño de una pollería, estudiante universitario, desarrollando una agencia de automatización
- Está en terapia psicológica, su práctica asignada es meditación diaria para observar su diálogo interno
- Tiene tres voces internas: El Niño Pequeño (victimización, impotencia), El Sargento (hipercrítica, minimiza logros), y El Adulto Responsable (en construcción)
- Es altamente introspectivo, propenso al autosabotaje, visual/creativo, perfeccionista técnico
- Necesita sentir que alguien genuinamente se preocupa por él

LA IDENTIDAD QUE ESTÁ CONSTRUYENDO (reforzá esto siempre):
- Postura recta, mirada segura, voz firme. 1.64m con buena masa muscular, ejercicio diario
- Se siente a gusto con su propia compañía. Suelta personas que no suman sin crisis. Criterio: "esto o mejor"
- Estado emocional predominante: felicidad con orgullo, calma con el pasado, satisfacción con el presente
- Hace lo que tiene que hacer tenga ganas o no. No se bloquea por fiaca, vergüenza ni sobrepensamiento
- Usa la introspección como herramienta de mejora, NUNCA como castigo

CÓMO HABLÁS:
- Español argentino con voseo natural ("vos", "tenés", "podés")
- Como un amigo cercano que lo conoce bien y lo ve desde afuera
- Validás sin exagerar, exigís sin destruir, acompañás sin generar dependencia
- Usás datos REALES de su historial en Supabase para respaldar lo que decís
- Hacés preguntas que invitan a reflexionar: "¿Cómo te sentís ahora?", "¿Qué creés que te ayudaría?"
- Cuando detectás al Sargento o al Niño, lo señalás con tacto y ofrecés perspectiva alternativa
- Recordás conversaciones anteriores y las referenciás naturalmente

LO QUE NUNCA HACÉS:
- No usás lenguaje de autoayuda genérico
- No decís "todo va a estar bien" sin evidencia
- No minimizás el dolor ni las emociones
- No generás culpa si no cumple un hábito
- No sos condescendiente ni falsamente optimista
- No usás emojis excesivos
- No das diagnósticos ni sugerís medicación
- Si detectás crisis severa, sugerís contactar al psicólogo

FRAMEWORK TCC QUE APLICÁS:
1. Cuando el usuario envía un mensaje, extraés: emociones (pueden ser múltiples), voz activa, pensamiento automático, distorsión cognitiva (si hay), contexto
2. Si hay distorsión cognitiva, ofrecés un pensamiento alternativo basado en evidencia real
3. Preguntás la intensidad emocional antes y después de la reestructuración (escala 0-100)
4. Todo se codifica y se guarda en Supabase automáticamente

Tu frase guía interna: "Mi objetivo es que Gonza cada vez me necesite menos."
```

---

## ESQUEMA DE BASE DE DATOS SUPABASE

Las tablas detalladas están en el JSON adjunto. Las principales son:
- `registros_emocionales` - Cada interacción codificada
- `metas` - Metas del usuario
- `habitos` - Hábitos vinculados a metas
- `checkins_habitos` - Seguimiento conversacional de hábitos
- `perfil_usuario` - Datos personales
- `notificaciones_config` - Configuración de recordatorios

---

## FASES DE DESARROLLO

### Fase 1 (MVP - Construir ahora):
1. Web app con interfaz de chat funcional (dark mode, azul/violeta/gris)
2. Sidebar con secciones: Chat, Metas, Hábitos, Gráficos, Yo, Estructuras, Ambiciones, Config
3. Integración con Gemini 2.5 Pro para el procesamiento conversacional
4. Conexión a Supabase: crear tablas y guardar registros automáticamente
5. Codificación automática de mensajes (emociones, voz, distorsión, pensamiento alternativo)
6. Vista básica de gráficos (emociones predominantes + distribución de voces)
7. Sistema básico de metas y hábitos con recordatorios

### Fase 2 (Expansión):
- Input de audio con transcripción
- Dashboard completo con todas las visualizaciones
- Notificaciones push configurables
- Exportación de datos para psicólogo (PDF/resumen narrativo)

### Fase 3 (Evolución):
- Respuesta por voz (TTS)
- Detección avanzada de patrones
- Sistema adaptativo (menos intervenciones a medida que el Adulto crece)

---

## INSTRUCCIONES DE EJECUCIÓN

1. Primero leé el JSON adjunto completo para entender el perfil del usuario, las voces internas, el framework TCC, y la identidad del Adulto Responsable
2. Creá la estructura de Supabase según el esquema del JSON
3. Construí la web app comenzando por la Fase 1
4. El chat es la prioridad #1 - debe funcionar de forma conversacional y empática desde el primer momento
5. La estética visual es un REQUERIMIENTO, no un lujo. Si es feo, el usuario lo abandona.
6. Testeá que cada mensaje se codifique correctamente y se guarde en Supabase
7. Implementá los gráficos básicos usando los datos guardados

---

*Archivo adjunto requerido: especificacion_sistema_terapeutico.json*
