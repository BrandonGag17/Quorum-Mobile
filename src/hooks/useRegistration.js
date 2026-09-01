import { useState } from 'react'

import { signUp } from '../services/authService'
import {
  checkEmailAvailable,
  checkUsernameAvailable,
  createUserProfile,
  normalizeDateToISO,
  saveUserGustos,
} from '../services/userService'

export function useRegistration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateStepOne = async ({ email, username, password, termsAccepted }) => {
    if (!email?.trim()) {
      return { valid: false, message: 'Ingresá un email' }
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailValido) {
      return { valid: false, message: 'Ingresá un email válido' }
    }

    if (!username?.trim()) {
      return { valid: false, message: 'Ingresá un nombre de usuario' }
    }

    if (!password?.trim()) {
      return { valid: false, message: 'Ingresá una contraseña' }
    }

    if (password.length < 8) {
      return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' }
    }

    if (!termsAccepted) {
      return { valid: false, message: 'Debés aceptar los términos y condiciones' }
    }

    const { available: usernameAvailable, error: usernameError } = await checkUsernameAvailable(username)
    if (!usernameAvailable) {
      return { valid: false, message: usernameError?.message || 'Ese nombre de usuario ya está en uso' }
    }

    const { available: emailAvailable, error: emailError } = await checkEmailAvailable(email)
    if (!emailAvailable) {
      return { valid: false, message: emailError?.message || 'Ese email ya está registrado' }
    }

    return { valid: true }
  }

  const completeRegistration = async (registrationData) => {
    setLoading(true)
    setError('')

    try {
      const preparedData = {
        email: registrationData.email?.trim(),
        password: registrationData.password,
        username: registrationData.username?.trim(),
        nombre: registrationData.nombre?.trim(),
        apellido: registrationData.apellido?.trim(),
        fecha_nacimiento: normalizeDateToISO(registrationData.fecha_nacimiento),
        localidad: (registrationData.barrio || registrationData.localidad || '').trim(),
        foto_perfil: registrationData.fotoUri || null,
        gustos: Array.isArray(registrationData.gustos) ? registrationData.gustos : [],
      }

      const { data: authData, error: signUpError } = await signUp(preparedData)
      if (signUpError) {
        throw new Error(signUpError.message)
      }

      const userId = authData?.user?.id
      if (!userId) {
        throw new Error('No se pudo crear la cuenta. Intentá nuevamente.')
      }

      const { error: profileError } = await createUserProfile({
        id: userId,
        username: preparedData.username,
        email: preparedData.email,
        nombre: preparedData.nombre,
        apellido: preparedData.apellido,
        fecha_nacimiento: preparedData.fecha_nacimiento,
        localidad: preparedData.localidad,
        foto_perfil: preparedData.foto_perfil,
      })

      if (profileError) {
        throw new Error(profileError.message || 'No se pudo guardar el perfil.')
      }

      const { error: gustosError } = await saveUserGustos({
        userId,
        gustos: preparedData.gustos,
      })

      if (gustosError) {
        throw new Error(gustosError.message || 'No se pudieron guardar los gustos.')
      }

      return { ok: true }
    } catch (err) {
      const message = err?.message || 'No se pudo completar el registro.'
      setError(message)
      return { ok: false, message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    setError,
    validateStepOne,
    completeRegistration,
  }
}
