// GET /api/order/[id]/download — redirect до підписаного PDF URL
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const order = await prisma.order.findUnique({ where: { id } })

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (order.status !== 'DONE' || !order.pdfUrl) {
    return NextResponse.json({ error: 'PDF not ready' }, { status: 409 })
  }

  // Перевірити термін зберігання (30 днів)
  if (order.pdfExpiry && order.pdfExpiry < new Date()) {
    return NextResponse.json(
      { error: 'PDF видалено — термін зберігання 30 днів вичерпано' },
      { status: 410 },
    )
  }

  return NextResponse.redirect(order.pdfUrl)
}
