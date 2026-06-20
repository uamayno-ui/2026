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

interface NormalizedSearchResult {
  id:    number
  label: string
  short: string
  sub:   string
  lat:   number
  lng:   number
  type:  string
}

function normalizeKey(value: string): string {
  return value
    .toLocaleLowerCase('uk-UA')
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim()
}

function uniqueParts(parts: (string | undefined | null)[], title: string): string[] {
  const seen = new Set<string>([normalizeKey(title)])
  const result: string[] = []

  for (const part of parts) {
    const value = part?.trim()
    if (!value) continue
    const key = normalizeKey(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result
}

function formatResult(r: SearchResult & { address?: Record<string, string> }): NormalizedSearchResult | null {
  const lat = Number(r.lat)
  const lng = Number(r.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const a = r.address ?? {}
  const displayParts = r.display_name.split(',').map((part) => part.trim()).filter(Boolean)
  const street = [a.road, a.house_number].filter(Boolean).join(', ')
  const locality = a.city ?? a.town ?? a.village ?? a.municipality ?? ''
  const title = street || a.amenity || a.building || locality || displayParts[0] || r.display_name

  const details = uniqueParts([
    a.suburb,
    a.city_district,
    locality,
    a.county,
    a.state,
    a.region,
    a.country,
    ...displayParts.slice(1),
  ], title)

  return {
    id:    r.place_id,
    label: r.display_name,
    short: title,
    sub:   details.slice(0, 3).join(', '),
    lat,
    lng,
    type:  r.type,
  }
}

function dedupeResults(results: NormalizedSearchResult[]): NormalizedSearchResult[] {
  const seen = new Set<string>()
  const deduped: NormalizedSearchResult[] = []

  for (const result of results) {
    const titleKey = normalizeKey(result.short)
    const subKey = normalizeKey(result.sub)
    const coordKey = `${result.lat.toFixed(4)}:${result.lng.toFixed(4)}`
    const key = subKey ? `${titleKey}|${subKey}` : `${titleKey}|${coordKey}`

    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(result)
  }

  return deduped
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

    return NextResponse.json(dedupeResults(results.map(formatResult).filter((r) => r !== null)))
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json([], { status: 200 })
  }
}
