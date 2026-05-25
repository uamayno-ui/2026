// GET /api/order/[id]/analysis — return AI risk analysis for a FULL order
// The analysis is stored in order.rawJson.aiAnalysis after payment+processing.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import type { AiRiskAnalysis } from '@/lib/ai/risk-analysis'

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

  if (order.type !== 'FULL') {
    return NextResponse.json({ error: 'Analysis only available for FULL orders' }, { status: 400 })
  }

  if (order.status !== 'DONE') {
    return NextResponse.json({ error: 'Order not ready', status: order.status }, { status: 409 })
  }

  const rawJson = order.rawJson as Record<string, unknown> | null
  const analysis = rawJson?.aiAnalysis as AiRiskAnalysis | undefined

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not yet available' }, { status: 202 })
  }

  return NextResponse.json(analysis)
}
