// POST /api/payment/liqpay/webhook — LiqPay payment callback
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import {
  assertLiqPayConfigured,
  isLiqPayConfigurationError,
  verifyWebhook,
  parseWebhook,
  mapLiqPayStatus,
} from '@/lib/payments/liqpay'
import { prisma } from '@/lib/prisma'
import { processOrder } from '@/lib/orders/processor'

function amountToKopiyky(amount: number | string): number {
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN
}

export async function POST(req: NextRequest) {
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

  if (process.env.NODE_ENV === 'production' && payload.status === 'sandbox') {
    return NextResponse.json({ error: 'Sandbox payments are not accepted in production' }, { status: 400 })
  }

  const ourStatus = mapLiqPayStatus(payload.status)

  // Знайти payment і оновити статус
  const payment = await prisma.payment.findUnique({
    where:   { orderId: payload.order_id },
    include: { order: true },
  })

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const callbackAmount = amountToKopiyky(payload.amount)
  if (
    payload.order_id !== payment.orderId ||
    callbackAmount !== payment.amount ||
    payload.currency !== payment.currency
  ) {
    console.warn('[liqpay/webhook] payment mismatch', {
      orderId: payload.order_id,
      currency: payload.currency,
      amount: payload.amount,
    })
    return NextResponse.json({ error: 'Payment mismatch' }, { status: 400 })
  }

  let shouldProcess = false

  await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where:   { id: payment.id },
      include: { order: true },
    })

    if (!currentPayment) throw new Error(`Payment ${payment.id} not found during webhook transaction`)

    const alreadySuccessful = currentPayment.status === 'SUCCESS'
    const orderStatus = currentPayment.order.status

    await tx.payment.update({
      where: { id: currentPayment.id },
      data: {
        status:      ourStatus,
        externalId:  String(payload.payment_id),
        webhookData: payload as unknown as Prisma.InputJsonValue,
      },
    })

    if (ourStatus === 'SUCCESS') {
      if (!alreadySuccessful && !['PROCESSING', 'DONE'].includes(orderStatus)) {
        await tx.order.update({
          where: { id: currentPayment.orderId },
          data:  { status: 'PAID' },
        })
        shouldProcess = true
      }
      return
    }

    if (ourStatus === 'REFUNDED') {
      await tx.order.update({
        where: { id: currentPayment.orderId },
        data:  { status: 'REFUNDED' },
      })
      return
    }

    if (ourStatus === 'FAILED' && !['PROCESSING', 'DONE'].includes(orderStatus)) {
      await tx.order.update({
        where: { id: currentPayment.orderId },
        data:  { status: 'FAILED' },
      })
    }
  })

  // Якщо оплачено — запускаємо обробку витягу (fire-and-forget)
  if (shouldProcess) {
    processOrder(payload.order_id).catch((err) =>
      console.error('[webhook] processOrder failed:', err)
    )
  }

  return NextResponse.json({ ok: true })
}
