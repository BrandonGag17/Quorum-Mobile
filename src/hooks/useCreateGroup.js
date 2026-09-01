import { useState } from 'react'
import supabase from '../services/supabaseClient'
import { createGroup } from '../services/groupService'

export default function useCreateGroup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const FOTO_DEFAULT =
    'https://fusjhtyvjkshuzxofeqj.supabase.co/storage/v1/object/public/avatars/PlaceholderGrupo.png'

  async function uploadImage(fotoUri, userId) {
    const response = await fetch(fotoUri)
    const blob = await response.blob()
    const extension = (fotoUri.split('.').pop() || 'jpg').split('?')[0]
    const nombreArchivo = `${userId}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(nombreArchivo, blob)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(nombreArchivo)
    return data?.publicUrl || null
  }

  async function create({ nombre, fotoUri = null, creatorId, miembros = [] }) {
    if (loading) return { data: null, error: 'busy' }

    setLoading(true)
    setError(null)

    try {
      if (!nombre || !nombre.trim()) {
        const msg = 'El nombre del grupo es obligatorio'
        setError(msg)
        setLoading(false)
        return { data: null, error: { message: msg } }
      }

      if (!creatorId) {
        const msg = 'No se proporcionó creatorId'
        setError(msg)
        setLoading(false)
        return { data: null, error: { message: msg } }
      }

      let fotoPerfil = FOTO_DEFAULT

      if (fotoUri) {
        try {
          const uploaded = await uploadImage(fotoUri, creatorId)
          if (uploaded) fotoPerfil = uploaded
        } catch (uploadErr) {
          setError(uploadErr?.message || String(uploadErr))
          setLoading(false)
          return { data: null, error: uploadErr }
        }
      }

      const miembrosIds = Array.isArray(miembros) ? miembros : []

      const { data, error } = await createGroup({
        nombre: nombre.trim(),
        fotoPerfil,
        creatorId,
        miembros: miembrosIds,
      })

      if (error) {
        setError(error.message || error)
        setLoading(false)
        return { data: null, error }
      }

      setLoading(false)
      return { data, error: null }
    } catch (err) {
      setError(err?.message || String(err))
      setLoading(false)
      return { data: null, error: err }
    }
  }

  return {
    create,
    loading,
    error,
  }
}