import { NextRequest, NextResponse } from 'next/server'

// Middleware runs at Edge — cannot use Prisma/Node.js drivers here.
// We only check cookie presence; full session validation happens inside page/route handlers.

const PROTECTED_PREFIXES = ['/app/']
const SESSION_COOKIE     = 'mayno_session'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected  = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*'],
}
