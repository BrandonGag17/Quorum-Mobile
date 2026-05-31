import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://fusjhtyvjkshuzxofeqj.supabase.co'
const supabaseKey = 'sb_publishable_sndOGlvYpoJbFKVnVnPOgg_Ksyw4JjE'

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: Platform.OS === 'web'
        ? localStorage
        : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
)

export default supabase
