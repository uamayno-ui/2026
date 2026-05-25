'use client'

import { useEffect } from 'react'

/**
 * Registers /sw.js on the client once the page has loaded.
 * Placed in the root layout — renders nothing visible.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Defer registration until after first paint
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        if (process.env.NODE_ENV === 'development') {
          console.log('[SW] registered:', reg.scope)
        }
      } catch (err) {
        console.error('[SW] registration failed:', err)
      }
    }

    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW, { once: true })
    }
  }, [])

  return null
}
