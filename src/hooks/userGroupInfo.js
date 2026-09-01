import { useState, useEffect, useCallback } from 'react'
import { getSession } from '../services/authService'
import { getUserById } from '../services/userService'
import {
  getGroupById,
  getGroupMembers,
  getUserByUsername,
  addUserToGroup,
  removeUserFromGroup
} from '../services/groupService'

export function useGroupInfo(groupId) {
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!groupId) {
      setGroup(null)
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [groupRes, membersRes] = await Promise.all([
        getGroupById(groupId),
        getGroupMembers(groupId)
      ])

      const errors = []

      if (groupRes.error) {
        errors.push(groupRes.error.message)
      } else {
        setGroup(groupRes.data ?? null)
      }

      if (membersRes.error) {
        errors.push(membersRes.error.message)
      } else {
        setMembers(membersRes.data ?? [])
      }

      if (errors.length > 0) {
        setError(errors.join('\n'))
      }
    } catch (err) {
      setError(err?.message || 'Ocurrió un error al cargar el grupo')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const addMemberById = useCallback(async (userId) => {
    if (!groupId || !userId) {
      return {
        data: null,
        error: {
          message: 'Faltan datos para agregar al miembro'
        }
      }
    }

    const alreadyMember = members.some(
      member => member.usuario?.id === userId
    )

    if (alreadyMember) {
      const error = {
        message: 'Ese usuario ya pertenece al grupo'
      }

      setError(error.message)

      return {
        data: null,
        error
      }
    }

    setActionLoading(true)
    setError(null)

    try {
      const { data, error } = await addUserToGroup({
        groupId,
        userId
      })

      if (error) {
        setError(error.message || 'No se pudo agregar al miembro')

        return {
          data: null,
          error
        }
      }

      const { data: user, error: userError } = await getUserById(userId)

      if (userError) {
        await load()

        return {
          data,
          error: null
        }
      }

      setMembers(prev => {
        if (prev.some(member => member.usuario?.id === user.id)) {
          return prev
        }

        return [...prev, { id_usuario: user.id, usuario: user }]
      })

      return {
        data,
        error: null
      }
    } catch (err) {
      setError(err?.message || 'No se pudo agregar al miembro')

      return {
        data: null,
        error: err
      }
    } finally {
      setActionLoading(false)
    }
  }, [groupId, members, load])

  const addMemberByUsername = useCallback(async (username) => {
    setError(null)

    const {
      data: user,
      error: userError
    } = await getUserByUsername(username)

    if (userError || !user) {
      const error = userError || {
        message: 'No se encontró el usuario'
      }

      setError(error.message)

      return {
        data: null,
        error
      }
    }

    return addMemberById(user.id)
  }, [addMemberById])

  const removeMember = useCallback(async (userId) => {
    if (!groupId || !userId) {
      return {
        error: {
          message: 'Faltan datos para eliminar al miembro'
        }
      }
    }

    setActionLoading(true)
    setError(null)

    try {
      const { error } = await removeUserFromGroup({
        groupId,
        userId
      })

      if (error) {
        setError(error.message || 'No se pudo eliminar al miembro')

        return { error }
      }

      setMembers(prev =>
        prev.filter(member => member.usuario?.id !== userId)
      )

      return {
        error: null
      }
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar al miembro')

      return {
        error: err
      }
    } finally {
      setActionLoading(false)
    }
  }, [groupId])

  const leaveGroup = useCallback(async () => {
    const { data: { session }, error: sessionError } = await getSession()

    if (sessionError) {
      const error = { message: 'No se pudo verificar la sesión' }
      setError(error.message)
      return { error }
    }

    const userId = session?.user?.id

    if (!userId) {
      const error = { message: 'No hay una sesión activa' }
      setError(error.message)
      return { error }
    }

    return removeMember(userId)
  }, [removeMember])

  return {
    group,
    members,
    memberCount: members.length,
    loading,
    actionLoading,
    error,
    load,
    addMemberById,
    addMemberByUsername,
    removeMember,
    leaveGroup
  }
}