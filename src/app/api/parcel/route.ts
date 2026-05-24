// GET /api/parcel?kadnum=... — публічна інформація про ділянку з ДЗК WFS
import { NextRequest, NextResponse } from 'next/server'
import { getParcelInfo } from '@/lib/registries/dzk'

export async function GET(req: NextRequest) {
  const kadnum = req.nextUrl.searchParams.get('kadnum')?.trim()

  if (!kadnum) {
    return NextResponse.json({ error: 'kadnum is required' }, { status: 400 })
  }

  // Базова валідація формату: XXXXXXXXXX:XX:XXX:XXXX
  const valid = /^\d{10}:\d{2}:\d{3}:\d{4}$/.test(kadnum)
  if (!valid) {
    return NextResponse.json({ error: 'Невірний формат кадастрового номера' }, { status: 400 })
  }

  const parcel = await getParcelInfo(kadnum)
  if (!parcel) {
    return NextResponse.json({ error: 'Ділянку не знайдено' }, { status: 404 })
  }

  return NextResponse.json(parcel, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
