import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fusjhtyvjkshuzxofeqj.supabase.co'
const supabaseKey = 'TU_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase