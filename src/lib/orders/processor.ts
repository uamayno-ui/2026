// Обробка замовлення після успішної оплати:
// ДЗК → e.land.gov.ua API
// ДРРП / FULL → Opendatabot
// FULL → AI-аналіз ризиків (Claude API)
// Збереження PDF URL, встановлення 30-денного expiry
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { orderDzkExcerpt, getDzkExcerptStatus, EXCERPT_TYPE } from '@/lib/registries/dzk'
import { orderDrrpExcerpt, getDrrpByKadnum } from '@/lib/registries/opendatabot'
import { sendOrderReady } from '@/lib/email/resend'
import { analyzeParcelRisk } from '@/lib/ai/risk-analysis'
import type { OrderType } from '@prisma/client'

const PDF_TTL_DAYS = 30

// ── Map OrderType → excerpt params ────────────────────────────────────
function getDzkExcerptType(type: OrderType): 9 | 12 | 48 | null {
  switch (type) {
    case 'DZK':  return EXCERPT_TYPE.DZK
    case 'PLAN': return EXCERPT_TYPE.PLAN
    case 'NGO':  return EXCERPT_TYPE.NGO
    default:     return null
  }
}

// ── Process single order ──────────────────────────────────────────────
export async function processOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: { user: { select: { fullName: true, rnokpp: true, email: true } } },
  })

  if (!order) throw new Error(`Order ${orderId} not found`)
  if (order.status !== 'PAID') {
    console.warn(`[processor] Order ${orderId} is not PAID (status: ${order.status})`)
    return
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING' } })

  try {
    let pdfUrl: string | null = null

    const dzkType = getDzkExcerptType(order.type)

    // ── DZK / PLAN / NGO ─────────────────────────────────────────────
    if (dzkType !== null && order.user.fullName && order.user.rnokpp) {
      const nameParts = order.user.fullName.split(' ')
      const excerpt = await orderDzkExcerpt({
        kadnum:      order.kadnum,
        excerptType: dzkType,
        applicant: {
          lastName:   nameParts[0] ?? '',
          firstName:  nameParts[1] ?? '',
          middleName: nameParts[2] ?? '',
          rnokpp:     order.user.rnokpp,
        },
      })

      // Поллінг статусу (макс 90 сек)
      if (excerpt.status === 'PROCESSING') {
        pdfUrl = await pollDzkStatus(excerpt.requestId, 90_000)
      } else {
        pdfUrl = excerpt.pdfUrl ?? null
      }
    }

    // ── DRRP ─────────────────────────────────────────────────────────
    else if (order.type === 'DRRP') {
      const result = await orderDrrpExcerpt(order.kadnum)
      pdfUrl = result?.pdfUrl ?? null
    }

    // ── FULL (DZK + DRRP + AI-аналіз) — запускаємо паралельно ─────────
    else if (order.type === 'FULL') {
      const [dzk, drrp, drrpData] = await Promise.allSettled([
        order.user.fullName && order.user.rnokpp
          ? orderDzkExcerpt({
              kadnum:      order.kadnum,
              excerptType: EXCERPT_TYPE.DZK,
              applicant: {
                lastName:   order.user.fullName.split(' ')[0] ?? '',
                firstName:  order.user.fullName.split(' ')[1] ?? '',
                middleName: order.user.fullName.split(' ')[2] ?? '',
                rnokpp:     order.user.rnokpp!,
              },
            })
          : Promise.resolve(null),
        orderDrrpExcerpt(order.kadnum),
        getDrrpByKadnum(order.kadnum),
      ])

      // Для FULL зберігаємо URL ДРРП (основний документ з правами)
      if (drrp.status === 'fulfilled' && drrp.value?.pdfUrl) {
        pdfUrl = drrp.value.pdfUrl
      }
      void dzk // DZK зберігаємо окремим механізмом (Sprint 4: ZIP)

      // AI-аналіз ризиків (fire-and-forget зберігання в rawJson)
      const drrpRecord = drrpData.status === 'fulfilled' ? drrpData.value : null
      analyzeParcelRisk({
        kadnum: order.kadnum,
        drrp:   drrpRecord ?? undefined,
      })
        .then((analysis) =>
          prisma.order.update({
            where: { id: orderId },
            data:  { rawJson: { aiAnalysis: analysis } as unknown as Prisma.InputJsonValue },
          })
        )
        .catch((err) => console.error('[processor] AI analysis failed:', err))
    }

    // ── Зберегти результат ────────────────────────────────────────────
    const pdfExpiry = new Date()
    pdfExpiry.setDate(pdfExpiry.getDate() + PDF_TTL_DAYS)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status:    'DONE',
        pdfUrl,
        pdfExpiry,
      },
    })

    // ── Email ─────────────────────────────────────────────────────────
    if (order.user.email) {
      const typeLabels: Record<string, string> = {
        DZK:  'Витяг з ДЗК',
        DRRP: 'Витяг з ДРРП',
        FULL: 'Повний звіт',
        NGO:  'НГО',
        PLAN: 'Кадастровий план',
      }
      await sendOrderReady({
        to:        order.user.email,
        orderType: typeLabels[order.type] ?? order.type,
        kadnum:    order.kadnum,
        orderId:   order.id,
        pdfExpiry,
      }).catch(console.error)
    }

  } catch (err) {
    console.error(`[processor] Order ${orderId} failed:`, err)
    await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED' } })
    throw err
  }
}

// ── Poll DZK until DONE or timeout ───────────────────────────────────
async function pollDzkStatus(requestId: string, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(5000)
    const status = await getDzkExcerptStatus(requestId)
    if (status.status === 'DONE')  return status.pdfUrl ?? null
    if (status.status === 'ERROR') throw new Error(`DZK error for ${requestId}`)
  }
  throw new Error(`DZK timeout for ${requestId}`)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
