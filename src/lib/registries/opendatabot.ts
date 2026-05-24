// Opendatabot API — reseller для ДРРП (Phase 1)
// Docs: https://docs.opendatabot.com
// Використовувати ЛИШЕ після підписання NDA і договору!

const BASE_URL = 'https://opendatabot.ua/api/v3'
const API_KEY  = process.env.OPENDATABOT_API_KEY ?? ''

function headers() {
  return {
    Authorization:  `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// ── Типи ─────────────────────────────────────────────────────────────

export interface DrrpOwner {
  fullName:  string
  rnokpp?:   string  // лише для авторизованих (Закон № 4292-IX)
  shareSize: string
  ownerType: 'PHYSICAL' | 'LEGAL' | 'STATE' | 'COMMUNAL'
}

export interface DrrpEncumbrance {
  type:        string
  description: string
  startDate:   string
  endDate?:    string
}

export interface DrrpRecord {
  registrationNumber: string
  kadnum:             string
  objectType:         string
  area:               number
  address?:           string // лише для фізосіб після авторизації
  owners:             DrrpOwner[]
  encumbrances:       DrrpEncumbrance[]
  registeredAt:       string
  pdfUrl?:            string
}

// ── Витяг з ДРРП за кадастровим номером ──────────────────────────────
export async function getDrrpByKadnum(
  kadnum: string,
): Promise<DrrpRecord | null> {
  if (!API_KEY) {
    console.warn('[opendatabot] API key not set — returning null')
    return null
  }

  try {
    const res = await fetch(
      `${BASE_URL}/realty/record?cadNumber=${encodeURIComponent(kadnum)}`,
      { headers: headers(), cache: 'no-store' },
    )
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Opendatabot error: ${res.status}`)

    const data = await res.json()

    // Фільтр: не показуємо точну адресу для юросіб (Закон № 4292-IX)
    const filtered: DrrpRecord = {
      ...data,
      address: data.owners?.some((o: DrrpOwner) => o.ownerType === 'LEGAL')
        ? undefined
        : data.address,
    }
    return filtered
  } catch (err) {
    console.error('[opendatabot] getDrrpByKadnum:', err)
    return null
  }
}

// ── Замовити офіційний PDF-витяг ──────────────────────────────────────
export async function orderDrrpExcerpt(kadnum: string): Promise<{
  orderId:    string
  status:     'PENDING' | 'DONE' | 'ERROR'
  pdfUrl?:    string
} | null> {
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/realty/excerpt`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ cadNumber: kadnum }),
    })
    if (!res.ok) throw new Error(`Opendatabot excerpt error: ${res.status}`)
    return res.json()
  } catch (err) {
    console.error('[opendatabot] orderDrrpExcerpt:', err)
    return null
  }
}
