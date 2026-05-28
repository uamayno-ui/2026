// Dynamic OG image for /parcel/[kadnum]
// Renders a branded card: Mayno logo + kadnum + quick stats
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Земельна ділянка — Mayno'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ kadnum: string }>
}) {
  const { kadnum } = await params
  const num = decodeURIComponent(kadnum).replace(/%3A/gi, ':')

  // Load Inter font from /public/fonts/ if available, else ImageResponse
  // will use its built-in sans-serif fallback.
  let fontData: Buffer | null = null
  try {
    fontData = await readFile(join(process.cwd(), 'public/fonts/Inter-SemiBold.ttf'))
  } catch {
    // Font not found — falls back to built-in
  }

  const fonts = fontData
    ? [{ name: 'Inter', data: fontData, weight: 600 as const, style: 'normal' as const }]
    : []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          padding: '64px 72px',
          fontFamily: fontData ? 'Inter' : 'system-ui, sans-serif',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>may</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#22C55E', letterSpacing: '-0.5px' }}>no</span>
          </div>
          {/* Tag */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#F8F9FB',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 14,
            color: '#6B7280',
            fontWeight: 500,
          }}>
            Земельний кадастр України
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 18, color: '#6B7280', fontWeight: 500 }}>
            Земельна ділянка
          </div>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#0A0A0A',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            fontFamily: 'monospace',
          }}>
            {num}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Pills */}
            {[
              { icon: '📋', text: 'Витяг з ДЗК' },
              { icon: '🏛️', text: 'Витяг з ДРРП' },
              { icon: '🤖', text: 'AI-аналіз ризиків' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#F8F9FB',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 14,
                  color: '#374151',
                  fontWeight: 500,
                }}
              >
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#22C55E',
            borderRadius: 999,
            padding: '14px 28px',
            fontSize: 16,
            color: '#FFFFFF',
            fontWeight: 600,
          }}>
            Перевірити за 60 сек →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  )
}
