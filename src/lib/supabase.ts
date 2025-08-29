import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser use (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types based on your SQLite schema
export interface User {
  id: number
  email: string
  password_hash: string
  name: string
  role: 'admin' | 'user'
  team_id?: number
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface Team {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  created_by: number
}

export interface Conversation {
  id: number
  session_id: string
  user_message: string
  ai_response: string
  timestamp: string
  team_id?: number
  user_id?: number
}

export interface TeamWidgetKey {
  id: number
  team_id?: number
  api_key: string
  key_name: string
  is_active: boolean
  created_at: string
  last_used?: string
  usage_count: number
  created_by?: number
  ngrok_url?: string
}

export interface WidgetConfig {
  id: number
  team_id?: number
  widget_title: string
  widget_subtitle: string
  primary_color: string
  secondary_color: string
  welcome_message: string
  input_placeholder: string
  widget_position: string
  show_avatar: boolean
  show_powered_by: boolean
  created_at: string
  updated_at: string
  created_by?: number
}

export interface LLMSettings {
  provider: 'openai' | 'ollama'
  openai_api_key?: string
  openai_model?: string
  ollama_url?: string
  ollama_model?: string
  max_tokens?: number
  temperature?: number
  custom_instructions?: string
}