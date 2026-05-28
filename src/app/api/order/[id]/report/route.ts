// GET /api/order/[id]/report — generate & stream the branded PDF for FULL orders
// For DZK/DRRP/NGO/PLAN the registry PDF is served via /download instead.
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { generateReportPdf } from '@/lib/pdf/report'
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
    return NextResponse.json(
      { error: 'Branded report is only available for FULL orders. Use /download for others.' },
      { status: 422 },
    )
  }

  if (order.status !== 'DONE') {
    return NextResponse.json({ error: 'Order not ready yet' }, { status: 409 })
  }

  if (order.pdfExpiry && order.pdfExpiry < new Date()) {
    return NextResponse.json(
      { error: 'Документ видалено — термін зберігання 30 днів вичерпано' },
      { status: 410 },
    )
  }

  // Extract AI analysis from rawJson
  const raw = order.rawJson as Record<string, unknown> | null
  const analysis = raw?.aiAnalysis as AiRiskAnalysis | undefined

  if (!analysis) {
    return NextResponse.json(
      { error: 'AI analysis not yet ready', retryAfter: 30 },
      { status: 202 },
    )
  }

  const pdfBuffer = await generateReportPdf({
    kadnum:  order.kadnum,
    analysis,
  })

  const filename = `mayno-report-${order.kadnum.replace(/:/g, '-')}.pdf`
  // NextResponse body must be a Web API BodyInit — convert Node Buffer → Uint8Array
  const uint8 = new Uint8Array(pdfBuffer)

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(uint8.byteLength),
      // PDFs are generated on-demand — cache client-side for 1h
      'Cache-Control':       'private, max-age=3600',
    },
  })
}
