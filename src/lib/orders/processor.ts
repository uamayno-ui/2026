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

function getApplicant(user: { fullName: string | null; rnokpp: string | null }) {
  if (!user.fullName || !user.rnokpp) {
    throw new Error('Bank ID identity is required for this registry service')
  }

  const [lastName = '', firstName = '', middleName = ''] = user.fullName.split(' ')
  return { lastName, firstName, middleName, rnokpp: user.rnokpp }
}

function requirePdfUrl(pdfUrl: string | null | undefined, service: string): string {
  if (!pdfUrl) {
    throw new Error(`${service} did not return a PDF artifact`)
  }
  return pdfUrl
}

async function orderDzkDocument({
  kadnum,
  excerptType,
  applicant,
}: {
  kadnum: string
  excerptType: 9 | 12 | 48
  applicant: ReturnType<typeof getApplicant>
}): Promise<string> {
  const excerpt = await orderDzkExcerpt({ kadnum, excerptType, applicant })

  if (excerpt.status === 'ERROR') {
    throw new Error(`DZK returned ERROR for ${kadnum}`)
  }

  const pdfUrl = excerpt.status === 'PROCESSING'
    ? await pollDzkStatus(excerpt.requestId, 90_000)
    : excerpt.pdfUrl

  return requirePdfUrl(pdfUrl, 'DZK')
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
    let rawJson: Prisma.InputJsonValue | undefined

    const dzkType = getDzkExcerptType(order.type)

    // ── DZK / PLAN / NGO ─────────────────────────────────────────────
    if (dzkType !== null) {
      pdfUrl = await orderDzkDocument({
        kadnum:      order.kadnum,
        excerptType: dzkType,
        applicant:   getApplicant(order.user),
      })
    }

    // ── DRRP ─────────────────────────────────────────────────────────
    else if (order.type === 'DRRP') {
      const result = await orderDrrpExcerpt(order.kadnum)
      if (!result || result.status !== 'DONE') {
        throw new Error('DRRP excerpt is not ready')
      }
      pdfUrl = requirePdfUrl(result.pdfUrl, 'DRRP')
    }

    // ── FULL (DZK + DRRP + AI-аналіз) ────────────────────────────────
    else if (order.type === 'FULL') {
      const applicant = getApplicant(order.user)
      const [dzkPdfUrl, drrp, drrpRecord] = await Promise.all([
        orderDzkDocument({
          kadnum:      order.kadnum,
          excerptType: EXCERPT_TYPE.DZK,
          applicant,
        }),
        orderDrrpExcerpt(order.kadnum),
        getDrrpByKadnum(order.kadnum),
      ])

      if (!drrp || drrp.status !== 'DONE') {
        throw new Error('DRRP excerpt is not ready for FULL report')
      }

      if (!drrpRecord) {
        throw new Error('DRRP source data is required for FULL report')
      }

      pdfUrl = requirePdfUrl(drrp.pdfUrl, 'FULL')

      const analysis = await analyzeParcelRisk({
        kadnum: order.kadnum,
        drrp:   drrpRecord,
      })

      rawJson = {
        sourceStatus: {
          dzk:  'available',
          drrp: 'available',
          ai:   'available',
        },
        dzkPdfUrl,
        drrpRecord,
        aiAnalysis: analysis,
      } as unknown as Prisma.InputJsonValue
    }

    else {
      throw new Error(`Unsupported automated order type: ${order.type}`)
    }

    pdfUrl = requirePdfUrl(pdfUrl, order.type)

    // ── Зберегти результат ────────────────────────────────────────────
    const pdfExpiry = new Date()
    pdfExpiry.setDate(pdfExpiry.getDate() + PDF_TTL_DAYS)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status:    'DONE',
        pdfUrl,
        pdfExpiry,
        ...(rawJson ? { rawJson } : {}),
      },
    })

    // ── Email ─────────────────────────────────────────────────────────
    if (order.user.email && pdfUrl) {
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
      }).catch((err) => console.error('[processor] sendOrderReady failed:', err))
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
