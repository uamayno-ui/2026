// e.land.gov.ua — Державний земельний кадастр (ДЗК)
// OAuth2 + витяг API
// Docs: https://e.land.gov.ua

const BASE_URL = 'https://e.land.gov.ua'

let _token: { value: string; expiresAt: number } | null = null

// ── OAuth2: отримати access token ────────────────────────────────────
async function getAccessToken(): Promise<string> {
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

  if (!res.ok) throw new Error(`ДЗК OAuth error: ${res.status}`)
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
}

export async function getParcelInfo(kadnum: string): Promise<DzkParcelInfo | null> {
  // WFS endpoint (публічний, без токена)
  const params = new URLSearchParams({
    service:     'WFS',
    version:     '1.1.0',
    request:     'GetFeature',
    typeName:    'kadastral_map:parcel',
    outputFormat: 'application/json',
    CQL_FILTER:  `kadnum='${kadnum}'`,
    maxFeatures: '1',
  })

  try {
    const res = await fetch(
      `https://map.land.gov.ua/geoserver/ows?${params}`,
      { next: { revalidate: 3600 } }, // кеш 1 год
    )
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null

    const p = feature.properties
    return {
      kadnum:      p.cadnum ?? kadnum,
      area:        p.area_ga ?? 0,
      purposeCode: p.purpose_code ?? '',
      purposeName: p.purpose_name ?? '',
      category:    p.category_name ?? '',
      ownership:   p.ownership_name ?? '',
      region:      p.region_name ?? '',
      district:    p.district_name ?? '',
      settlement:  p.council_name ?? '',
    }
  } catch {
    return null
  }
}
