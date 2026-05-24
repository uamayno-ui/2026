// POST /api/payment/liqpay/webhook — LiqPay payment callback
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { verifyWebhook, parseWebhook, mapLiqPayStatus } from '@/lib/payments/liqpay'
import { prisma } from '@/lib/prisma'
import { processOrder } from '@/lib/orders/processor'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const data      = formData.get('data')      as string
  const signature = formData.get('signature') as string

  if (!data || !signature) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Перевірити підпис
  if (!verifyWebhook(data, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = parseWebhook(data)
  const ourStatus = mapLiqPayStatus(payload.status)

  // Знайти payment і оновити статус
  const payment = await prisma.payment.findFirst({
    where: { order: { id: payload.order_id } },
  })

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  await prisma.$transaction([
    // Оновити Payment
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:      ourStatus,
        externalId:  String(payload.payment_id),
        webhookData: payload as unknown as Prisma.InputJsonValue,
      },
    }),
    // Оновити Order
    prisma.order.update({
      where: { id: payload.order_id },
      data: {
        status: ourStatus === 'SUCCESS' ? 'PAID' : 'FAILED',
      },
    }),
  ])

  // Якщо оплачено — запускаємо обробку витягу (fire-and-forget)
  if (ourStatus === 'SUCCESS') {
    processOrder(payload.order_id).catch((err) =>
      console.error('[webhook] processOrder failed:', err)
    )
  }

  return NextResponse.json({ ok: true })
}
