// POST /api/auth/logout
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession, clearCookieOptions } from '@/lib/auth/session'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('mayno_session')?.value

  if (token) await deleteSession(token)

  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  const opts = clearCookieOptions()
  res.cookies.set(opts)
  return res
}
