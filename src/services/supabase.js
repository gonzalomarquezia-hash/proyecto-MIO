import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---- PERFIL ----
export async function getProfile() {
  const { data, error } = await supabase
    .from('perfil_usuario')
    .select('*')
    .limit(1)
    .single()
  if (error) console.error('Error fetching profile:', error)
  return data
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('perfil_usuario')
    .update({ ...updates, datos_actualizados_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) console.error('Error updating profile:', error)
  return data
}

// ---- REGISTROS EMOCIONALES ----
export async function saveEmotionalRecord(record) {
  const { data, error } = await supabase
    .from('registros_emocionales')
    .insert(record)
    .select()
    .single()
  if (error) console.error('Error saving record:', error)
  return data
}

export async function getEmotionalRecords(userId, limit = 50) {
  const { data, error } = await supabase
    .from('registros_emocionales')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) console.error('Error fetching records:', error)
  return data || []
}

export async function getRecentRecordsForContext(userId, limit = 10) {
  const { data, error } = await supabase
    .from('registros_emocionales')
    .select('mensaje_raw, estado_emocional, voz_identificada, pensamiento_alternativo, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) console.error('Error fetching context:', error)
  return data || []
}

// ---- METAS ----
export async function getMetas(userId) {
  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) console.error('Error fetching metas:', error)
  return data || []
}

export async function createMeta(meta) {
  const { data, error } = await supabase
    .from('metas')
    .insert(meta)
    .select()
    .single()
  if (error) console.error('Error creating meta:', error)
  return data
}

export async function updateMeta(id, updates) {
  const { data, error } = await supabase
    .from('metas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) console.error('Error updating meta:', error)
  return data
}

export async function deleteMeta(id) {
  const { error } = await supabase
    .from('metas')
    .delete()
    .eq('id', id)
  if (error) console.error('Error deleting meta:', error)
  return !error
}

// ---- HÁBITOS ----
export async function getHabitos(userId) {
  const { data, error } = await supabase
    .from('habitos')
    .select('*, metas(titulo)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) console.error('Error fetching habitos:', error)
  return data || []
}

export async function createHabito(habito) {
  const { data, error } = await supabase
    .from('habitos')
    .insert(habito)
    .select()
    .single()
  if (error) console.error('Error creating habito:', error)
  return data
}

export async function updateHabito(id, updates) {
  const { data, error } = await supabase
    .from('habitos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) console.error('Error updating habito:', error)
  return data
}

export async function deleteHabito(id) {
  const { error } = await supabase
    .from('habitos')
    .delete()
    .eq('id', id)
  if (error) console.error('Error deleting habito:', error)
  return !error
}

// ---- CHECK-INS ----
export async function getCheckins(habitoId) {
  const { data, error } = await supabase
    .from('checkins_habitos')
    .select('*')
    .eq('habito_id', habitoId)
    .order('fecha', { ascending: false })
    .limit(30)
  if (error) console.error('Error fetching checkins:', error)
  return data || []
}

export async function createCheckin(checkin) {
  const { data, error } = await supabase
    .from('checkins_habitos')
    .insert(checkin)
    .select()
    .single()
  if (error) console.error('Error creating checkin:', error)
  return data
}

// ---- LOGROS ----
export async function saveLogro(logro) {
  const { data, error } = await supabase
    .from('logros')
    .insert(logro)
    .select()
    .single()
  if (error) console.error('Error saving logro:', error)
  return data
}

export async function getLogros(userId, limit = 20) {
  const { data, error } = await supabase
    .from('logros')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) console.error('Error fetching logros:', error)
  return data || []
}

// ---- CONVERSACIONES ----
export async function createConversacion(conv) {
  const { data, error } = await supabase
    .from('conversaciones')
    .insert(conv)
    .select()
    .single()
  if (error) console.error('Error creating conversacion:', error)
  return data
}

export async function getConversaciones(userId, limit = 20) {
  const { data, error } = await supabase
    .from('conversaciones')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) console.error('Error fetching conversaciones:', error)
  // Add message count manually
  const convs = data || []
  for (const c of convs) {
    const { count } = await supabase
      .from('mensajes_chat')
      .select('*', { count: 'exact', head: true })
      .eq('conversacion_id', c.id)
    c.mensaje_count = count || 0
  }
  return convs
}

export async function updateConversacion(id, updates) {
  const { data, error } = await supabase
    .from('conversaciones')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) console.error('Error updating conversacion:', error)
  return data
}

// ---- MENSAJES DE CHAT ----
export async function saveChatMessage(msg) {
  const { data, error } = await supabase
    .from('mensajes_chat')
    .insert(msg)
    .select()
    .single()
  if (error) console.error('Error saving chat message:', error)
  return data
}

export async function getChatMessages(conversacionId) {
  const { data, error } = await supabase
    .from('mensajes_chat')
    .select('*')
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: true })
  if (error) console.error('Error fetching chat messages:', error)
  return data || []
}
