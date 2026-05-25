'use client'

import { useState, useCallback } from 'react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface UsePushReturn {
  permission:  PermissionState
  subscribing: boolean
  subscribe:   () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushReturn {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  const [subscribing, setSubscribing] = useState(false)
  const [permission, setPermission] = useState<PermissionState>(
    !supported
      ? 'unsupported'
      : (Notification.permission as PermissionState)
  )

  const subscribe = useCallback(async () => {
    if (!supported) return
    setSubscribing(true)
    try {
      // 1. Get public VAPID key
      const res = await fetch('/api/push/subscribe')
      if (!res.ok) throw new Error('Push not configured on server')
      const { vapidPublicKey } = await res.json()

      // 2. Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)
      if (perm !== 'granted') return

      // 3. Get SW registration
      const reg = await navigator.serviceWorker.ready

      // 4. Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // 5. Send to server
      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(subscription.toJSON()),
      })
    } catch (err) {
      console.error('[push] subscribe failed:', err)
    } finally {
      setSubscribing(false)
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await fetch('/api/push/subscribe', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setPermission('default')
    } catch (err) {
      console.error('[push] unsubscribe failed:', err)
    }
  }, [supported])

  return { permission, subscribing, subscribe, unsubscribe }
}

// Convert base64url VAPID key to Uint8Array for PushManager.subscribe
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  const array   = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i)
  return array.buffer
}
