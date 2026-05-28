import type { NextConfig } from 'next'

// ── Security headers ──────────────────────────────────────────────────
const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  // Referrer policy — send origin on same-site, only origin on cross-site
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // Permissions Policy — disable unused powerful features
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'geolocation=(self)',             // allow geolocation for the map
      'push=(self)',                    // allow Web Push
      'notifications=(self)',           // allow notifications
    ].join(', '),
  },
  // Strict Transport Security (HSTS) — only sent in production via Vercel
  // Vercel adds this automatically; including here for custom deployments
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Mapbox tiles (satellite layer)
      { protocol: 'https', hostname: '*.tiles.mapbox.com' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
      // WMS cadastral layer
      { protocol: 'https', hostname: 'map.land.gov.ua' },
      // Registry PDF storage (e.land.gov.ua, opendatabot CDN)
      { protocol: 'https', hostname: '*.land.gov.ua' },
      { protocol: 'https', hostname: '*.opendatabot.com' },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Service worker must be served from root without cache busting
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // PWA icons — long cache
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  async redirects() {
    return [
      // Legacy URL support — if someone bookmarked /parcel/3222486200%3A05 etc.
      {
        source:      '/parcel/:kadnum*',
        has:         [{ type: 'query', key: 'kadnum' }],
        destination: '/parcel/:kadnum*',
        permanent:   false,
      },
    ]
  },
}

export default nextConfig
