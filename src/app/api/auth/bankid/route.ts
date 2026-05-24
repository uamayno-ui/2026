// GET /api/auth/bankid — redirect to Bank ID authorization page
import { NextResponse } from 'next/server'
import { getBankIdAuthUrl } from '@/lib/auth/bankid'
import { cookies } from 'next/headers'

export async function GET() {
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
