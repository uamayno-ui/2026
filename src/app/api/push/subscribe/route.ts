// POST /api/push/subscribe  — save browser PushSubscription
// DELETE /api/push/subscribe — remove subscription
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

interface PushSubscriptionBody {
  endpoint: string
  keys: {
    p256dh: string
    auth:   string
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as PushSubscriptionBody

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
  }

  // Upsert by endpoint — same device re-subscribing gets updated keys
  await prisma.pushSubscription.upsert({
    where:  { endpoint: body.endpoint },
    create: {
      userId:   user.id,
      endpoint: body.endpoint,
      p256dh:   body.keys.p256dh,
      auth:     body.keys.auth,
    },
    update: {
      userId: user.id,
      p256dh: body.keys.p256dh,
      auth:   body.keys.auth,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = (await req.json()) as { endpoint: string }
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  })

  return NextResponse.json({ ok: true })
}

// GET /api/push/subscribe?vapidKey=1 — return the public VAPID key for subscription
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  return NextResponse.json({ vapidPublicKey: key })
}
