// GET /api/search?q=... — геокодинг адреси через Nominatim
import { NextRequest, NextResponse } from 'next/server'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA_VIEWBOX = '22.1,52.4,40.2,44.3' // [minLng,maxLat,maxLng,minLat]

// Розширення поширених українських скорочень для Nominatim
function expandAbbreviations(q: string): string {
  return q
    .replace(/\bвул\.?\s/gi,   'вулиця ')
    .replace(/\bпр-т\.?\s/gi,  'проспект ')
    .replace(/\bпросп\.?\s/gi, 'проспект ')
    .replace(/\bпр\.?\s/gi,    'проспект ')
    .replace(/\bбул\.?\s/gi,   'бульвар ')
    .replace(/\bпл\.?\s/gi,    'площа ')
    .replace(/\bпров\.?\s/gi,  'провулок ')
    .replace(/\bш\.?\s/gi,     'шосе ')
    .replace(/\bмкр\.?\s/gi,   'мікрорайон ')
    .replace(/\bм\.?\s/gi,     'місто ')
    .trim()
}

export interface SearchResult {
  place_id:     number
  display_name: string
  lat:          string
  lon:          string
  type:         string
  importance:   number
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('q')?.trim()
  if (!raw || raw.length < 2) {
    return NextResponse.json([], { status: 200 })
  }

  const q = expandAbbreviations(raw)

  try {
    const params = new URLSearchParams({
      q,
      format:            'json',
      addressdetails:    '1',   // потрібно для subtitle (місто/район)
      limit:             '6',
      countrycodes:      'ua',
      viewbox:           UA_VIEWBOX,
      bounded:           '0',
      'accept-language': 'uk',
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { 'User-Agent': 'Mayno/1.0 (mayno.ua; contact@mayno.ua)' },
      signal: controller.signal,
      next: { revalidate: 300 },
    })
    clearTimeout(timer)

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

    const results: (SearchResult & {
      address?: Record<string, string>
    })[] = await res.json()

    return NextResponse.json(results.map((r) => {
      // Формуємо зрозумілий підпис: вулиця + місто
      const a = r.address ?? {}
      const street = [a.road, a.house_number].filter(Boolean).join(', ')
      const city   = a.city ?? a.town ?? a.village ?? a.municipality ?? ''
      const sub    = [street || null, city || null].filter(Boolean).join(' · ') || r.display_name

      return {
        id:    r.place_id,
        label: r.display_name,   // повна назва (для URL/пошуку)
        short: street || r.display_name.split(',')[0].trim(), // коротка (для input)
        sub,                      // підпис в dropdown
        lat:   Number(r.lat),
        lng:   Number(r.lon),
        type:  r.type,
      }
    }))
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json([], { status: 200 })
  }
}
