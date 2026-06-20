// POST /api/order — створити нове замовлення і отримати checkout URL
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { assertLiqPayConfigured, createLiqPayParams, isLiqPayConfigurationError } from '@/lib/payments/liqpay'
import type { OrderType } from '@prisma/client'

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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, kadnum } = body as { type: string; kadnum: string }

  if (!type || !kadnum) {
    return NextResponse.json({ error: 'type і kadnum обов\'язкові' }, { status: 400 })
  }

  const price = PRICES[type]
  if (!price) {
    return NextResponse.json({ error: 'Невідомий тип замовлення' }, { status: 400 })
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
      kadnum,
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
  const description = `${DESCRIPTIONS[type] ?? type}: ${kadnum}`
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
