import { useEffect } from 'react'

export function useNotificationBack(navigation, route) {
  const fromNotification = route?.params?.fromNotification === true

  useEffect(() => {
    if (!fromNotification) return undefined

    return navigation.addListener('beforeRemove', (event) => {
      event.preventDefault()
      navigation.setParams({ fromNotification: false })
      navigation.getParent()?.navigate('Notificaciones')
    })
  }, [fromNotification, navigation])
}
