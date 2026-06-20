// Bank ID НБУ OAuth2 client
// Docs: https://id.bank.gov.ua/doc
// Тестовий контур: https://testid.bank.gov.ua

export class BankIdConfigurationError extends Error {
  constructor() {
    super('Bank ID is not configured')
    this.name = 'BankIdConfigurationError'
  }
}

export function isBankIdConfigurationError(err: unknown): err is BankIdConfigurationError {
  return err instanceof BankIdConfigurationError
}

function getBankIdConfig() {
  const clientId     = process.env.BANKID_CLIENT_ID?.trim() ?? ''
  const clientSecret = process.env.BANKID_CLIENT_SECRET?.trim() ?? ''
  const redirectUri  = process.env.BANKID_REDIRECT_URI?.trim()
    ?? 'http://localhost:3000/api/auth/bankid/callback'

  if (process.env.NODE_ENV === 'production' && (!clientId || !clientSecret || !redirectUri)) {
    throw new BankIdConfigurationError()
  }

  return {
    baseUrl: process.env.BANKID_ENV === 'production'
      ? 'https://id.bank.gov.ua'
      : 'https://testid.bank.gov.ua',
    clientId,
    clientSecret,
    redirectUri,
  }
}

export function assertBankIdConfigured() {
  getBankIdConfig()
}

// ── Step 1: redirect URL ──────────────────────────────────────────────
export function getBankIdAuthUrl(state: string): string {
  const config = getBankIdConfig()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     config.clientId,
    redirect_uri:  config.redirectUri,
    scope:         'openid name inn phone email',
    state,
  })
  return `${config.baseUrl}/v1/bank/oauth2/authorize?${params}`
}

// ── Step 2: exchange code → tokens ────────────────────────────────────
export async function exchangeCode(code: string): Promise<{
  access_token: string
  id_token: string
}> {
  const config = getBankIdConfig()
  const res = await fetch(`${config.baseUrl}/v1/bank/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     config.clientId,
      client_secret: config.clientSecret,
      redirect_uri:  config.redirectUri,
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
  const config = getBankIdConfig()
  const res = await fetch(`${config.baseUrl}/v1/bank/resource/client`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`BankID userinfo error: ${res.status}`)
  return res.json()
}
