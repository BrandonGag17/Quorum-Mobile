import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fusjhtyvjkshuzxofeqj.supabase.co'
const supabaseKey = 'sb_publishable_sndOGlvYpoJbFKVnVnPOgg_Ksyw4JjE'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase