// Mayno Service Worker — app-shell caching + push notifications
// Version bump this string to force cache refresh on deploy:
const CACHE_VERSION = 'v1'
const CACHE_NAME    = `mayno-shell-${CACHE_VERSION}`

// Resources to pre-cache (app shell)
const SHELL_URLS = [
  '/',
  '/map',
  '/pricing',
  '/login',
  '/offline',
]

// ── Install: pre-cache shell ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Ignore failures — shell URLs may not all exist yet
      Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
    )
  )
  // Activate new SW immediately without waiting for old tabs to close
  self.skipWaiting()
})

// ── Activate: delete old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('mayno-shell-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for API, cache-first for shell ───────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API routes — always network, never cache
  if (url.pathname.startsWith('/api/')) return

  // _next/static — cache-first (immutable hashed assets)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        return res
      }))
    )
    return
  }

  // App shell pages — network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached ?? caches.match('/offline').then(
            (offline) => offline ?? new Response('Офлайн', { status: 503 })
          )
        )
      )
  )
})

// ── Push: show notification ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Mayno', body: 'Є оновлення по вашій ділянці', url: '/app/monitoring' }

  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_) { /* ignore parse errors */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      data:    { url: data.url },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open',    title: 'Переглянути' },
        { action: 'dismiss', title: 'Закрити'     },
      ],
    })
  )
})

// ── Notification click: open/focus the right URL ──────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url ?? '/app/monitoring'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
      } else {
        self.clients.openWindow(targetUrl)
      }
    })
  )
})
