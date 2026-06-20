// GET /api/auth/bankid — redirect to Bank ID authorization page
import { NextResponse } from 'next/server'
import { assertBankIdConfigured, getBankIdAuthUrl, isBankIdConfigurationError } from '@/lib/auth/bankid'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    assertBankIdConfigured()
  } catch (err) {
    if (isBankIdConfigurationError(err)) {
      return NextResponse.json(
        { error: 'Авторизація через Bank ID тимчасово недоступна.' },
        { status: 503 },
      )
    }
    throw err
  }

  // CSRF state
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('bankid_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 хв
    path: '/',
  })

  const url = getBankIdAuthUrl(state)
  return NextResponse.redirect(url)
}
