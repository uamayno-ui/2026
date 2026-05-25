// GET /api/cron/monitoring — щоденна перевірка моніторингових об'єктів
// Запускається через Vercel Cron (vercel.json) або зовнішній планувальник.
// Захищено CRON_SECRET — лише Vercel або адмін може викликати.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDrrpByKadnum } from '@/lib/registries/opendatabot'
import { sendMonitoringAlert } from '@/lib/email/resend'
import { sendPushToUser } from '@/lib/push/webpush'

// Vercel Cron передає Authorization: Bearer <CRON_SECRET>
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev: пропускаємо
  return auth === `Bearer ${secret}`
}

// ── Порівняння знімків ────────────────────────────────────────────────
type Snapshot = {
  owners?:       { fullName: string; ownerType: string }[]
  encumbrances?: { type: string }[]
}

function detectChanges(
  prev: Snapshot,
  curr: Snapshot,
): string[] {
  const changes: string[] = []

  // Перевірка зміни власника
  const prevOwners = (prev.owners ?? []).map((o) => o.fullName).sort().join(',')
  const currOwners = (curr.owners ?? []).map((o) => o.fullName).sort().join(',')
  if (prevOwners !== currOwners) changes.push('owner_changed')

  // Нові обтяження
  const prevEnc = (prev.encumbrances ?? []).length
  const currEnc = (curr.encumbrances ?? []).length
  if (currEnc > prevEnc) changes.push('encumbrance_added')

  return changes
}

// ── Main handler ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  let checked = 0, changed = 0, errors = 0

  // Беремо активні об'єкти порціями по 50
  const objects = await prisma.monitoringObject.findMany({
    where:   { active: true },
    include: { user: { select: { id: true, email: true, fullName: true } } },
    take:    50,
    orderBy: { lastChecked: 'asc' }, // спочатку ті, що давно перевірялись
  })

  for (const obj of objects) {
    try {
      const current = await getDrrpByKadnum(obj.kadnum)
      if (!current) { errors++; continue }

      const prev = (obj.lastSnapshot as Snapshot | null) ?? {}
      const curr: Snapshot = {
        owners:       current.owners,
        encumbrances: current.encumbrances,
      }

      const changes = detectChanges(prev, curr)

      // Зберігаємо новий знімок і час перевірки
      await prisma.monitoringObject.update({
        where: { id: obj.id },
        data: {
          lastSnapshot: curr as object,
          lastChecked:  new Date(),
          ...(changes.length > 0 ? { lastChanged: new Date() } : {}),
        },
      })

      // Якщо є зміни — записуємо alert і надсилаємо email
      if (changes.length > 0) {
        changed++
        await prisma.monitoringAlert.createMany({
          data: changes.map((changeType) => ({
            objectId:   obj.id,
            changeType,
            details:    { prev, curr } as object,
            notified:   false,
          })),
        })

        // Email-сповіщення
        if (obj.user.email) {
          for (const changeType of changes) {
            await sendMonitoringAlert({
              to:         obj.user.email,
              kadnum:     obj.kadnum,
              changeType,
              label:      obj.label ?? undefined,
            }).catch(console.error)
          }
        }

        // Web Push-сповіщення (якщо є підписки)
        const changeLabel = changes.includes('owner_changed')
          ? 'Змінився власник'
          : 'Зміна в реєстрі'
        await sendPushToUser(obj.user.id, {
          title: `⚠️ ${changeLabel}`,
          body:  obj.label ?? obj.kadnum,
          url:   `/parcel/${obj.kadnum}`,
        }).catch(console.error)

        // Позначити alerts як notified
        await prisma.monitoringAlert.updateMany({
          where:  { objectId: obj.id, notified: false },
          data:   { notified: true },
        })
      }

      checked++
    } catch (err) {
      console.error(`[cron/monitoring] ${obj.kadnum}:`, err)
      errors++
    }
  }

  const elapsed = Date.now() - started
  console.info(`[cron/monitoring] checked=${checked} changed=${changed} errors=${errors} ms=${elapsed}`)

  return NextResponse.json({ checked, changed, errors, ms: elapsed })
}
