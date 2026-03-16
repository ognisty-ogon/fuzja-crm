import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'SUPABASE_URL'
const supabaseAnonKey = 'ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)