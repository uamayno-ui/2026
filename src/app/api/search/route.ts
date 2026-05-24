// GET /api/search?q=... — геокодинг адреси через Nominatim
import { NextRequest, NextResponse } from 'next/server'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA_VIEWBOX = '22.1,52.4,40.2,44.3' // [minLng,maxLat,maxLng,minLat]

export interface SearchResult {
  place_id:    number
  display_name: string
  lat:         string
  lon:         string
  type:        string
  importance:  number
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([], { status: 200 })
  }

  try {
    const params = new URLSearchParams({
      q,
      format:          'json',
      addressdetails:  '0',
      limit:           '5',
      countrycodes:    'ua',
      viewbox:         UA_VIEWBOX,
      bounded:         '0',
      'accept-language': 'uk',
    })

    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: {
        'User-Agent': 'Mayno/1.0 (mayno.ua; contact@mayno.ua)',
      },
      next: { revalidate: 300 }, // кеш 5 хв
    })

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)
    const results: SearchResult[] = await res.json()

    return NextResponse.json(results.map((r) => ({
      id:    r.place_id,
      label: r.display_name,
      lat:   Number(r.lat),
      lng:   Number(r.lon),
      type:  r.type,
    })))
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json([], { status: 200 })
  }
}
