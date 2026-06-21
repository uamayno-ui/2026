// POST /api/order — створити нове замовлення і отримати checkout URL
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { assertLiqPayConfigured, createLiqPayParams, isLiqPayConfigurationError } from '@/lib/payments/liqpay'
import type { OrderType } from '@prisma/client'

const CADASTRAL_NUMBER_RE = /^\d{10}:\d{2}:\d{3}:\d{4}$/
const REGISTRY_UNAVAILABLE_MESSAGE = 'Послуга тимчасово недоступна. Підключення до реєстру ще не активне.'

// Ціни в копійках
const PRICES: Record<string, number> = {
  DZK:          10000,  // 100 грн
  DRRP:         30000,  // 300 грн
  FULL:         40000,  // 400 грн
  NGO:          10000,  // 100 грн
  PLAN:         10000,  // 100 грн
  OWNER_SEARCH: 25000,  // 250 грн
}

const DESCRIPTIONS: Record<string, string> = {
  DZK:          'Витяг з ДЗК',
  DRRP:         'Витяг з ДРРП',
  FULL:         'Повний звіт (ДЗК + ДРРП + AI)',
  NGO:          'Нормативна грошова оцінка',
  PLAN:         'Кадастровий план',
  OWNER_SEARCH: 'Пошук власника',
}

function requiredProviderEnv(type: string): string[] {
  switch (type) {
    case 'DZK':
    case 'NGO':
    case 'PLAN':
      return ['DZK_CLIENT_ID', 'DZK_CLIENT_SECRET']
    case 'DRRP':
      return ['OPENDATABOT_API_KEY']
    case 'FULL':
      return ['DZK_CLIENT_ID', 'DZK_CLIENT_SECRET', 'OPENDATABOT_API_KEY', 'ANTHROPIC_API_KEY']
    default:
      return []
  }
}

function missingProviderEnv(type: string): string[] {
  return requiredProviderEnv(type).filter((key) => !process.env[key]?.trim())
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, kadnum } = body as { type: string; kadnum: string }
  const normalizedKadnum = kadnum?.trim()

  if (!type || !normalizedKadnum) {
    return NextResponse.json({ error: 'type і kadnum обов\'язкові' }, { status: 400 })
  }

  if (!CADASTRAL_NUMBER_RE.test(normalizedKadnum)) {
    return NextResponse.json({ error: 'Перевірте формат кадастрового номера.' }, { status: 400 })
  }

  const price = PRICES[type]
  if (!price) {
    return NextResponse.json({ error: 'Невідомий тип замовлення' }, { status: 400 })
  }

  if (type === 'OWNER_SEARCH') {
    return NextResponse.json({ error: 'Послуга доступна через ручний запит.' }, { status: 422 })
  }

  const missingEnv = missingProviderEnv(type)
  if (missingEnv.length > 0) {
    console.warn(`[order] provider env missing for ${type}: ${missingEnv.join(', ')}`)
    return NextResponse.json({ error: REGISTRY_UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  if (['DZK', 'NGO', 'PLAN', 'FULL'].includes(type) && (!user.fullName || !user.rnokpp)) {
    return NextResponse.json(
      { error: 'Для цієї послуги потрібна авторизація через Bank ID.' },
      { status: 422 },
    )
  }

  try {
    assertLiqPayConfigured()
  } catch (err) {
    if (isLiqPayConfigurationError(err)) {
      return NextResponse.json(
        { error: 'Оплата тимчасово недоступна. Спробуйте пізніше.' },
        { status: 503 },
      )
    }
    throw err
  }

  // Створити Order у БД
  const order = await prisma.order.create({
    data: {
      userId:    user.id,
      type:      type as OrderType,
      status:    'PENDING',
      kadnum:    normalizedKadnum,
      pricePaid: price,
    },
  })

  // Створити Payment запис
  await prisma.payment.create({
    data: {
      orderId:  order.id,
      userId:   user.id,
      amount:   price,
      currency: 'UAH',
      status:   'PENDING',
    },
  })

  // Генерувати LiqPay checkout params
  const description = `${DESCRIPTIONS[type] ?? type}: ${normalizedKadnum}`
  const liqpay = createLiqPayParams({
    orderId:     order.id,
    amount:      price / 100,
    description,
  })

  return NextResponse.json({
    orderId:          order.id,
    liqpayData:       liqpay.data,
    liqpaySignature:  liqpay.signature,
    checkoutUrl:      `https://www.liqpay.ua/api/3/checkout?data=${liqpay.data}&signature=${liqpay.signature}`,
  })
}

// GET /api/order — список замовлень поточного користувача
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page  = Number(searchParams.get('page')  ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, type: true, status: true, kadnum: true,
        pricePaid: true, pdfUrl: true, pdfExpiry: true, createdAt: true,
      },
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ])

  return NextResponse.json({ orders, total, page, limit })
}
