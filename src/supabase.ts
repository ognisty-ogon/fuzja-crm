import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseUserIdRaw = import.meta.env.VITE_SUPABASE_USER_ID

export const configuredUserId = typeof supabaseUserIdRaw === 'string' ? supabaseUserIdRaw.trim() : ''

const hasSupabaseConfig = Boolean(supabaseUrl) && Boolean(supabaseAnonKey) && Boolean(configuredUserId)

export const supabaseConfigError = hasSupabaseConfig
	? ''
	: 'Brak konfiguracji Supabase. Ustaw VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY i VITE_SUPABASE_USER_ID w .env.local i zrestartuj dev server.'

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null