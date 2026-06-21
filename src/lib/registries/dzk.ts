// e.land.gov.ua — Державний земельний кадастр (ДЗК)
// OAuth2 + витяг API
// Docs: https://e.land.gov.ua

const BASE_URL = 'https://e.land.gov.ua'

let _token: { value: string; expiresAt: number } | null = null

export class DzkProviderUnavailableError extends Error {
  constructor(message = 'DZK provider is not configured') {
    super(message)
    this.name = 'DzkProviderUnavailableError'
  }
}

export function assertDzkConfigured() {
  if (!process.env.DZK_CLIENT_ID?.trim() || !process.env.DZK_CLIENT_SECRET?.trim()) {
    throw new DzkProviderUnavailableError()
  }
}

// ── OAuth2: отримати access token ────────────────────────────────────
async function getAccessToken(): Promise<string> {
  assertDzkConfigured()
  if (_token && Date.now() < _token.expiresAt - 30_000) return _token.value

  const res = await fetch(`${BASE_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.DZK_CLIENT_ID     ?? '',
      client_secret: process.env.DZK_CLIENT_SECRET ?? '',
    }),
    cache: 'no-store',
  })

  if (!res.ok) throw new DzkProviderUnavailableError(`DZK OAuth error: ${res.status}`)
  const data = await res.json()

  _token = {
    value:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return _token.value
}

// ── Типи витягів ─────────────────────────────────────────────────────
export const EXCERPT_TYPE = {
  DZK:   9,  // Витяг з ДЗК
  PLAN:  12, // Кадастровий план
  NGO:   48, // НГО
} as const

// ── Замовити витяг ───────────────────────────────────────────────────
export interface DzkExcerptRequest {
  kadnum:      string
  excerptType: 9 | 12 | 48
  // Дані заявника (з Bank ID сесії)
  applicant: {
    lastName:   string
    firstName:  string
    middleName: string
    rnokpp:     string
  }
}

export interface DzkExcerptResponse {
  requestId: string   // ID для отримання PDF
  status:    'PROCESSING' | 'DONE' | 'ERROR'
  pdfUrl?:   string
  error?:    string
}

export async function orderDzkExcerpt(
  req: DzkExcerptRequest,
): Promise<DzkExcerptResponse> {
  const token = await getAccessToken()

  const res = await fetch(`${BASE_URL}/api/excerpt/json`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      excerptType:  req.excerptType,
      unitCode:     req.kadnum,
      applicant:    req.applicant,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ДЗК excerpt error ${res.status}: ${text}`)
  }

  return res.json()
}

// ── Перевірити статус і отримати PDF ─────────────────────────────────
export async function getDzkExcerptStatus(
  requestId: string,
): Promise<DzkExcerptResponse> {
  const token = await getAccessToken()

  const res = await fetch(`${BASE_URL}/api/excerpt/json/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`ДЗК status error: ${res.status}`)
  return res.json()
}

// ── Пошук за кадастровим номером (публічна WFS інформація) ───────────
export interface DzkParcelInfo {
  kadnum:      string
  area:        number    // в га
  purposeCode: string
  purposeName: string
  category:    string
  ownership:   string
  region:      string
  district:    string
  settlement:  string
  // Точна адреса — не повертаємо для юросіб (Закон № 4292-IX)
  // Геометрія з WFS (для відображення на карті)
  center?:  [number, number]    // [lat, lng]
  polygon?: [number, number][]  // зовнішнє кільце [[lat, lng], ...]
}

const WFS_BASE = 'https://map.land.gov.ua/geoserver/ows'
const WFS_COMMON = {
  service:      'WFS',
  version:      '1.1.0',
  request:      'GetFeature',
  typeName:     'kadastral_map:parcel',
  outputFormat: 'application/json',
  maxFeatures:  '1',
}

/** Парсить GeoJSON Feature → DzkParcelInfo */
function featureToParcelInfo(feature: Record<string, unknown>, kadnum: string): DzkParcelInfo {
  const p = feature.properties as Record<string, unknown>
  const geom = feature.geometry as {
    type: string
    coordinates: number[][][]
  } | null

  // Конвертуємо GeoJSON [lng, lat] → наш формат [lat, lng]
  let center: [number, number] | undefined
  let polygon: [number, number][] | undefined

  if (geom?.type === 'Polygon' && geom.coordinates?.[0]?.length) {
    const ring = geom.coordinates[0]
    polygon = ring.map(([lng, lat]) => [lat, lng] as [number, number])
    // центр = середнє по всіх точках зовнішнього кільця
    const avgLat = ring.reduce((s, c) => s + c[1], 0) / ring.length
    const avgLng = ring.reduce((s, c) => s + c[0], 0) / ring.length
    center = [avgLat, avgLng]
  } else if (geom?.type === 'MultiPolygon') {
    const firstRing = (geom.coordinates as unknown as number[][][][])[0]?.[0]
    if (firstRing?.length) {
      polygon = firstRing.map(([lng, lat]) => [lat, lng] as [number, number])
      const avgLat = firstRing.reduce((s, c) => s + c[1], 0) / firstRing.length
      const avgLng = firstRing.reduce((s, c) => s + c[0], 0) / firstRing.length
      center = [avgLat, avgLng]
    }
  }

  return {
    kadnum:      String(p.cadnum ?? p.cad_num ?? kadnum),
    area:        Number(p.area_ga ?? p.area ?? 0),
    purposeCode: String(p.purpose_code ?? p.pur_code ?? ''),
    purposeName: String(p.purpose_name ?? p.pur_name ?? ''),
    category:    String(p.category_name ?? p.cat_name ?? ''),
    ownership:   String(p.ownership_name ?? p.own_name ?? ''),
    region:      String(p.region_name ?? p.reg_name ?? ''),
    district:    String(p.district_name ?? p.distr_name ?? ''),
    settlement:  String(p.council_name ?? p.rada_name ?? ''),
    center,
    polygon,
  }
}

export async function getParcelInfo(kadnum: string): Promise<DzkParcelInfo | null> {
  const params = new URLSearchParams({
    ...WFS_COMMON,
    CQL_FILTER: `cadnum='${kadnum}'`,
  })

  try {
    const res = await fetch(`${WFS_BASE}?${params}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    return featureToParcelInfo(feature as Record<string, unknown>, kadnum)
  } catch {
    return null
  }
}

/**
 * Знайти ділянку за географічними координатами (клік на карті).
 * Використовує WFS bbox-запит із маленькою областю навколо точки.
 */
export async function getParcelByPoint(
  lat: number,
  lng: number,
): Promise<DzkParcelInfo | null> {
  const delta = 0.00005 // ~5 метрів
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta},EPSG:4326`

  const params = new URLSearchParams({
    ...WFS_COMMON,
    bbox,
  })

  try {
    const res = await fetch(`${WFS_BASE}?${params}`, {
      next: { revalidate: 60 }, // коротший кеш для кліку
    })
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    const p = feature.properties as Record<string, unknown>
    const kadnum = String(p.cadnum ?? p.cad_num ?? '')
    return featureToParcelInfo(feature as Record<string, unknown>, kadnum)
  } catch {
    return null
  }
}
