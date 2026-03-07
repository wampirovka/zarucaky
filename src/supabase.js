import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Chybí VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY v .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

VITE_ANTHROPIC_KEY=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