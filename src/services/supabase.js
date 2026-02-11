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
