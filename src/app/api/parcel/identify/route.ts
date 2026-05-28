// GET /api/parcel/identify?lat=50.4501&lng=30.5234
// Знаходить ділянку за координатами кліку через WFS bbox
import { NextRequest, NextResponse } from 'next/server'
import { getParcelByPoint } from '@/lib/registries/dzk'

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  if (lat < 44 || lat > 53 || lng < 22 || lng > 41) {
    return NextResponse.json({ error: 'Coordinates outside Ukraine' }, { status: 400 })
  }

  const parcel = await getParcelByPoint(lat, lng)
  if (!parcel) {
    return NextResponse.json({ error: 'Ділянку не знайдено в цій точці' }, { status: 404 })
  }

  return NextResponse.json(parcel, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
