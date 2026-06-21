// LiqPay payment integration
// Docs: https://www.liqpay.ua/documentation/api/aquiring/checkout/doc

import crypto from 'crypto'

export class LiqPayConfigurationError extends Error {
  constructor() {
    super('LiqPay is not configured')
    this.name = 'LiqPayConfigurationError'
  }
}

export function isLiqPayConfigurationError(err: unknown): err is LiqPayConfigurationError {
  return err instanceof LiqPayConfigurationError
}

function getLiqPayConfig() {
  const publicKey  = process.env.LIQPAY_PUBLIC_KEY?.trim() ?? ''
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim() ?? ''

  if (process.env.NODE_ENV === 'production' && (!publicKey || !privateKey)) {
    throw new LiqPayConfigurationError()
  }

  return {
    publicKey,
    privateKey,
    appUrl:  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    sandbox: process.env.LIQPAY_SANDBOX === 'true' ? 1 : 0,
  }
}

export function assertLiqPayConfigured() {
  getLiqPayConfig()
}

// ── Helpers ───────────────────────────────────────────────────────────

function encodeData(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
}

function makeSignature(data: string): string {
  const { privateKey } = getLiqPayConfig()
  return crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64')
}

// ── Create checkout form params ────────────────────────────────────────

export interface LiqPayOrderParams {
  orderId:     string   // наш Order.id
  amount:      number   // в гривнях
  description: string   // напр. "Витяг з ДЗК 3222486200:05:002:0054"
  resultUrl?:  string   // куди redirect після оплати
  serverUrl?:  string   // webhook URL
}

export function createLiqPayParams(params: LiqPayOrderParams): {
  data:      string
  signature: string
} {
  const config = getLiqPayConfig()
  const payload = {
    version:     '3',
    public_key:  config.publicKey,
    action:      'pay',
    amount:      params.amount,
    currency:    'UAH',
    description: params.description,
    order_id:    params.orderId,
    result_url:  params.resultUrl ?? `${config.appUrl}/app/orders`,
    server_url:  params.serverUrl ?? `${config.appUrl}/api/payment/liqpay/webhook`,
    language:    'uk',
    // Тестовий режим — прибрати в production!
    sandbox:     config.sandbox,
  }
  const data = encodeData(payload)
  return { data, signature: makeSignature(data) }
}

// ── Verify webhook signature ───────────────────────────────────────────

export function verifyWebhook(data: string, signature: string): boolean {
  const expected = makeSignature(data)
  return expected === signature
}

// ── Parse webhook payload ──────────────────────────────────────────────

export interface LiqPayWebhookPayload {
  order_id:   string
  status:     'success' | 'failure' | 'error' | 'reversed' | 'sandbox'
  payment_id: number | string
  amount:     number | string
  currency:   string
  description: string
}

export function parseWebhook(data: string): LiqPayWebhookPayload {
  return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
}

// ── Map LiqPay status → our PaymentStatus ────────────────────────────

export function mapLiqPayStatus(
  status: string,
): 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' {
  switch (status) {
    case 'success':  return 'SUCCESS'
    case 'sandbox':  return process.env.NODE_ENV === 'production' ? 'FAILED' : 'SUCCESS'
    case 'reversed': return 'REFUNDED'
    case 'failure':
    case 'error':    return 'FAILED'
    default:         return 'PENDING'
  }
}
