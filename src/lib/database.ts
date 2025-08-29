import { supabaseAdmin } from './supabase'
import type { User, Team, Conversation, TeamWidgetKey, WidgetConfig, LLMSettings } from './supabase'

// User database operations
export async function createUser(userData: Omit<User, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(userData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getUserById(id: number) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateUser(id: number, updates: Partial<User>) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getAllUsers(teamId?: number) {
  let query = supabaseAdmin.from('users').select('*')
  
  if (teamId) {
    query = query.eq('team_id', teamId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Team database operations
export async function createTeam(teamData: Omit<Team, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .insert(teamData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getTeamById(id: number) {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getAllTeams() {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function updateTeam(id: number, updates: Partial<Team>) {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteTeam(id: number) {
  const { error } = await supabaseAdmin
    .from('teams')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Conversation database operations
export async function saveConversation(conversationData: Omit<Conversation, 'id'>) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert(conversationData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getConversationsByTeam(teamId: number, limit = 100) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('team_id', teamId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}

export async function getConversationsBySession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Widget key database operations
export async function createWidgetKey(keyData: Omit<TeamWidgetKey, 'id' | 'created_at' | 'usage_count'>) {
  const { data, error } = await supabaseAdmin
    .from('team_widget_keys')
    .insert(keyData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function validateWidgetKey(apiKey: string) {
  const { data, error } = await supabaseAdmin
    .from('team_widget_keys')
    .select(`
      *,
      teams(name, is_active)
    `)
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function incrementWidgetKeyUsage(apiKey: string) {
  // First get current usage count
  const { data: currentData, error: fetchError } = await supabaseAdmin
    .from('team_widget_keys')
    .select('usage_count')
    .eq('api_key', apiKey)
    .single()
  
  if (fetchError) throw fetchError
  
  const { error } = await supabaseAdmin
    .from('team_widget_keys')
    .update({ 
      usage_count: (currentData?.usage_count || 0) + 1,
      last_used: new Date().toISOString()
    })
    .eq('api_key', apiKey)
  
  if (error) throw error
}

export async function getWidgetKeysByTeam(teamId: number) {
  const { data, error } = await supabaseAdmin
    .from('team_widget_keys')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getTeamWidgetKeys(teamId: number) {
  return getWidgetKeysByTeam(teamId)
}

export async function getWidgetKeyById(id: number) {
  const { data, error } = await supabaseAdmin
    .from('team_widget_keys')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateWidgetKey(id: number, updates: Partial<TeamWidgetKey>) {
  const { data, error } = await supabaseAdmin
    .from('team_widget_keys')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteWidgetKey(id: number) {
  const { error } = await supabaseAdmin
    .from('team_widget_keys')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Widget configuration operations
export async function getWidgetConfig(teamId: number) {
  const { data, error } = await supabaseAdmin
    .from('widget_configs')
    .select('*')
    .eq('team_id', teamId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createWidgetConfig(configData: Omit<WidgetConfig, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseAdmin
    .from('widget_configs')
    .insert(configData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateWidgetConfig(teamId: number, updates: Partial<WidgetConfig>) {
  const { data, error } = await supabaseAdmin
    .from('widget_configs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('team_id', teamId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function createOrUpdateWidgetConfig(configData: Omit<WidgetConfig, 'id' | 'created_at' | 'updated_at'>) {
  // Try to update existing config first
  const teamId = configData.team_id
  if (!teamId) throw new Error('team_id is required')
  
  const existing = await getWidgetConfig(teamId)
  
  if (existing) {
    return updateWidgetConfig(teamId, configData)
  } else {
    return createWidgetConfig(configData)
  }
}

// LLM Settings operations
export async function getLLMSettings() {
  const { data, error } = await supabaseAdmin
    .from('llm_settings')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    // Return default settings if none exist
    return {
      provider: 'ollama',
      ollama_url: 'http://localhost:11434',
      ollama_model: 'qwen2.5:14b-instruct-q4_K_M',
      max_tokens: 2048,
      temperature: 0.7
    } as LLMSettings
  }
  
  return data
}

export async function getTeamLlmSettings(teamId: number) {
  // For now, return global LLM settings
  // In future, could be team-specific settings
  return getLLMSettings()
}

export async function saveLLMSettings(settings: Partial<LLMSettings>, updatedBy?: number) {
  // First try to update existing record
  const { data: existing } = await supabaseAdmin
    .from('llm_settings')
    .select('id')
    .limit(1)
    .single()
  
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('llm_settings')
      .update({ ...settings, updated_at: new Date().toISOString(), updated_by: updatedBy })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } else {
    // Create new record
    const { data, error } = await supabaseAdmin
      .from('llm_settings')
      .insert({ ...settings, updated_by: updatedBy })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Custom questions operations
export async function getCustomQuestions(teamId: number) {
  const { data, error } = await supabaseAdmin
    .from('custom_questions')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function saveCustomQuestions(teamId: number, questions: string[], createdBy: number) {
  // First deactivate existing questions
  await supabaseAdmin
    .from('custom_questions')
    .update({ is_active: false })
    .eq('team_id', teamId)
  
  // Insert new questions
  const questionData = questions.map((question, index) => ({
    team_id: teamId,
    question,
    order_index: index,
    created_by: createdBy
  }))
  
  const { data, error } = await supabaseAdmin
    .from('custom_questions')
    .insert(questionData)
    .select()
  
  if (error) throw error
  return data
}

// Contacts operations
export async function saveContact(contactData: {
  name?: string
  email?: string
  phone?: string
  message?: string
  team_id?: number
}) {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .insert(contactData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getContactsByTeam(teamId: number) {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getAllContacts() {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select(`
      *,
      teams(name)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Audit log operations
export async function logAuditEvent(eventData: {
  user_id?: number
  action: string
  entity_type?: string
  entity_id?: number
  details?: any
  ip_address?: string
  user_agent?: string
}) {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .insert(eventData)
    .select()
    .single()
  
  if (error) throw error
  return data
}