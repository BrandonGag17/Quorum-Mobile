import { Platform } from 'react-native'
import { signInWithGoogle } from '../services/authService'

export async function iniciarConexionGoogleCalendar() {
  const { data, error } = await signInWithGoogle()

  if (error) {
    return { success: false, error }
  }

  return {
    success: true,
    data,
  }
}

export { signInWithGoogle }
