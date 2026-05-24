import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

const SESSION_COOKIE = 'mayno_session'
const SESSION_TTL_DAYS = 30

// ── Get current user from session cookie ──────────────────────────────
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

// ── Create session (called after successful auth) ──────────────────────
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  })

  return session.token
}

// ── Delete session (logout) ────────────────────────────────────────────
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { token } }).catch(() => {})
}

// ── Set / clear session cookie ─────────────────────────────────────────
export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  }
}

export function clearCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}
