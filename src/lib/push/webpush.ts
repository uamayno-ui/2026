// Web Push (VAPID) — send push notifications via web-push library
import webPush from 'web-push'
import { prisma } from '@/lib/prisma'

let _configured = false

function normalizeVapidSubject(value: string | undefined): string {
  const subject = value?.trim() || 'support@mayno.ua'
  return subject.toLowerCase().startsWith('mailto:') ? subject : `mailto:${subject}`
}

function configure() {
  if (_configured) return
  const publicKey  = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject    = normalizeVapidSubject(process.env.VAPID_SUBJECT)

  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set')
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)
  _configured = true
}

// ── Send a push notification to all subscriptions of a user ──────────
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  configure()

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (!subscriptions.length) return

  const payloadJson = JSON.stringify(payload)

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth:   sub.auth,
            },
          },
          payloadJson,
        )
      } catch (err: unknown) {
        // 410 Gone or 404 Not Found → subscription expired, remove it
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        } else {
          console.error('[push] sendNotification failed:', err)
        }
      }
    }),
  )
}
