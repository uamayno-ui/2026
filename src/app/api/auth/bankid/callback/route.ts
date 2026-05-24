// GET /api/auth/bankid/callback — handle Bank ID OAuth callback
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode, getBankIdUser } from '@/lib/auth/bankid'
import { prisma } from '@/lib/prisma'
import { createSession, sessionCookieOptions } from '@/lib/auth/session'
import { sendWelcome } from '@/lib/email/resend'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // ── Error from Bank ID ─────────────────────────────────────────────
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_params', req.url))
  }

  // ── Verify CSRF state ──────────────────────────────────────────────
  const cookieStore = await cookies()
  const savedState = cookieStore.get('bankid_state')?.value
  cookieStore.delete('bankid_state')

  if (state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', req.url))
  }

  try {
    // ── Exchange code for tokens ───────────────────────────────────────
    const { access_token } = await exchangeCode(code)

    // ── Get user info from Bank ID ─────────────────────────────────────
    const bankIdUser = await getBankIdUser(access_token)

    // ── Upsert user in DB ──────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where:  { bankIdSub: bankIdUser.sub },
      update: {
        fullName: bankIdUser.name,
        rnokpp:   bankIdUser.inn,
        phone:    bankIdUser.phone,
        email:    bankIdUser.email,
      },
      create: {
        bankIdSub: bankIdUser.sub,
        fullName:  bankIdUser.name,
        rnokpp:    bankIdUser.inn,
        phone:     bankIdUser.phone,
        email:     bankIdUser.email,
      },
    })

    // ── Welcome email для нових користувачів ──────────────────────────
    const isNew = user.createdAt.getTime() === user.updatedAt.getTime()
    if (isNew && user.email && user.fullName) {
      // fire-and-forget — не блокуємо redirect
      sendWelcome({ to: user.email, name: user.fullName }).catch(console.error)
    }

    // ── Create session ─────────────────────────────────────────────────
    const token = await createSession(user.id)

    // Redirect to ?next= or overview
    const nextPath = searchParams.get('next') ?? '/app/overview'
    const safeNext = nextPath.startsWith('/') ? nextPath : '/app/overview'
    const res = NextResponse.redirect(new URL(safeNext, req.url))
    const opts = sessionCookieOptions(token)
    res.cookies.set(opts)
    return res

  } catch (err) {
    console.error('[bankid/callback]', err)
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))
  }
}
