// GET /api/wms?... — proxy для map.land.gov.ua WMS (обхід CORS)
// У production Vercel rewrites замінять цей роут на прямий запит з серверу.
import { NextRequest, NextResponse } from 'next/server'

const WMS_BASE = 'https://map.land.gov.ua/geowebcache/service/wms'

// Дозволені параметри WMS (whitelist, щоб не передавати довільні запити)
const ALLOWED_PARAMS = new Set([
  'SERVICE', 'VERSION', 'REQUEST', 'LAYERS', 'STYLES',
  'FORMAT', 'TRANSPARENT', 'HEIGHT', 'WIDTH', 'SRS', 'BBOX',
  'CQL_FILTER', 'TILED',
])

export async function GET(req: NextRequest) {
  const inParams  = req.nextUrl.searchParams
  const outParams = new URLSearchParams()

  for (const [key, value] of inParams.entries()) {
    if (ALLOWED_PARAMS.has(key.toUpperCase())) {
      outParams.set(key, value)
    }
  }

  try {
    const upstream = await fetch(`${WMS_BASE}?${outParams}`, {
      headers: {
        'User-Agent': 'Mayno/1.0 (mayno.ua)',
        'Referer':    'https://mayno.ua/',
      },
      // Короткий кеш — тайли не змінюються часто
      next: { revalidate: 3600 },
    })

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png'
    const buffer      = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':                contentType,
        'Cache-Control':               'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
