// Bank ID НБУ OAuth2 client
// Docs: https://id.bank.gov.ua/doc
// Тестовий контур: https://testid.bank.gov.ua

const BANKID_BASE =
  process.env.BANKID_ENV === 'production'
    ? 'https://id.bank.gov.ua'
    : 'https://testid.bank.gov.ua'

const CLIENT_ID     = process.env.BANKID_CLIENT_ID     ?? ''
const CLIENT_SECRET = process.env.BANKID_CLIENT_SECRET ?? ''
const REDIRECT_URI  = process.env.BANKID_REDIRECT_URI  ?? 'http://localhost:3000/api/auth/bankid/callback'

// ── Step 1: redirect URL ──────────────────────────────────────────────
export function getBankIdAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    scope:         'openid name inn phone email',
    state,
  })
  return `${BANKID_BASE}/v1/bank/oauth2/authorize?${params}`
}

// ── Step 2: exchange code → tokens ────────────────────────────────────
export async function exchangeCode(code: string): Promise<{
  access_token: string
  id_token: string
}> {
  const res = await fetch(`${BANKID_BASE}/v1/bank/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
    }),
  })
  if (!res.ok) throw new Error(`BankID token error: ${res.status}`)
  return res.json()
}

// ── Step 3: get user info ─────────────────────────────────────────────
export interface BankIdUser {
  sub:      string   // унікальний ID у Bank ID
  name:     string   // ПІБ
  inn:      string   // РНОКПП
  phone?:   string
  email?:   string
}

export async function getBankIdUser(accessToken: string): Promise<BankIdUser> {
  const res = await fetch(`${BANKID_BASE}/v1/bank/resource/client`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`BankID userinfo error: ${res.status}`)
  return res.json()
}
