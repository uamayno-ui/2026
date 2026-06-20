import type { Parcel } from '@/types/map'

// ── GeoJSON helpers ───────────────────────────────────────────────────
// mapData stores coords as [lat, lng] (Leaflet convention)
// GeoJSON / Mapbox GL requires [lng, lat]

type GeoJSONFC = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id: string
    properties: Record<string, string>
    geometry: { type: 'Polygon'; coordinates: number[][][] }
  }>
}

export function parcelsToGeoJSON(parcels: Parcel[]): GeoJSONFC {
  return {
    type: 'FeatureCollection',
    features: parcels.map((p) => {
      const ring = p.polygon.map(([lat, lng]) => [lng, lat])
      ring.push(ring[0]) // close ring
      return {
        type: 'Feature',
        id: p.id,
        properties: { id: p.id, kadnum: p.kadnum, area: p.area, purpose: p.purpose },
        geometry: { type: 'Polygon', coordinates: [ring] },
      }
    }),
  }
}

export function decoToGeoJSON(polys: [number, number][][]): GeoJSONFC {
  return {
    type: 'FeatureCollection',
    features: polys.map((poly, i) => {
      const ring = poly.map(([lat, lng]) => [lng, lat])
      ring.push(ring[0])
      return {
        type: 'Feature',
        id: `deco-${i}`,
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] },
      }
    }),
  }
}

export const KYIV_CENTER: [number, number] = [50.4498, 30.5235]

// ── DzkParcelInfo → Parcel ────────────────────────────────────────────
import type { DzkParcelInfo } from '@/lib/registries/dzk'

export function dzkToParcel(info: DzkParcelInfo): import('@/types/map').Parcel {
  const center = info.center ?? [50.4498, 30.5235]
  // Якщо полігон є — використовуємо; інакше генеруємо заглушку навколо центру
  const polygon = info.polygon && info.polygon.length >= 3
    ? info.polygon
    : makeDecoParcel(center[0], center[1], 0.0001, 0.0002)

  return {
    id:        info.kadnum,
    kadnum:    info.kadnum,
    address:   info.settlement || info.district || info.region || 'Україна',
    region:    [info.region, info.district].filter(Boolean).join(', '),
    area:      info.area ? `${info.area.toFixed(4)} га` : '—',
    purpose:   info.purposeName || info.purposeCode || '—',
    ownership: info.ownership || '—',
    coords:    center ? `${center[0].toFixed(4)}° ${center[1].toFixed(4)}°` : '—',
    center,
    polygon,
  }
}
export const UA_BOUNDS: [[number, number], [number, number]] = [[44.3, 22.1], [52.4, 40.2]]

export const PARCELS: Parcel[] = [
  {
    id: 'p1', kadnum: '0000000000:00:000:0001',
    address: 'Демо-ділянка 1', region: 'Район Києва (демо)',
    area: '0,4218 га', purpose: 'Громадська забудова', ownership: 'Комунальна',
    coords: '50.4501° 30.5234°',
    center: [50.4501, 30.5234],
    polygon: [[50.44995, 30.52295], [50.45028, 30.52317], [50.45016, 30.52380], [50.44985, 30.52358]],
  },
  {
    id: 'p2', kadnum: '0000000000:00:000:0002',
    address: 'Демо-ділянка 2', region: 'Район Києва (демо)',
    area: '0,3024 га', purpose: 'Громадська забудова', ownership: 'Державна',
    coords: '50.4508° 30.5225°',
    center: [50.4508, 30.5225],
    polygon: [[50.45062, 30.52210], [50.45093, 30.52232], [50.45083, 30.52298], [50.45055, 30.52275]],
  },
  {
    id: 'p3', kadnum: '0000000000:00:000:0003',
    address: 'Демо-ділянка 3', region: 'Район Києва (демо)',
    area: '0,0612 га', purpose: 'Багатоповерхова житлова', ownership: 'Приватна',
    coords: '50.4496° 30.5215°',
    center: [50.4495, 30.5219],
    polygon: [[50.44941, 30.52166], [50.44960, 30.52182], [50.44953, 30.52220], [50.44935, 30.52203]],
  },
  {
    id: 'p4', kadnum: '0000000000:00:000:0004',
    address: 'Демо-ділянка 4', region: 'Район Києва (демо)',
    area: '0,2105 га', purpose: 'Комерційна забудова', ownership: 'Приватна',
    coords: '50.4490° 30.5247°',
    center: [50.4490, 30.5247],
    polygon: [[50.44888, 30.52440], [50.44917, 30.52458], [50.44908, 30.52508], [50.44880, 30.52492]],
  },
  {
    id: 'p5', kadnum: '0000000000:00:000:0005',
    address: 'Демо-ділянка 5', region: 'Район Києва (демо)',
    area: '0,1842 га', purpose: 'Громадська забудова', ownership: 'Приватна',
    coords: '50.4475° 30.5240°',
    center: [50.4475, 30.5240],
    polygon: [[50.44740, 30.52372], [50.44765, 30.52390], [50.44758, 30.52432], [50.44733, 30.52414]],
  },
]

function makeDecoParcel(cLat: number, cLng: number, dLat = 0.00018, dLng = 0.00025): [number, number][] {
  return [
    [cLat - dLat, cLng - dLng],
    [cLat - dLat * 0.85, cLng + dLng],
    [cLat + dLat * 0.92, cLng + dLng],
    [cLat + dLat, cLng - dLng * 0.9],
  ]
}

const DECO_SEEDS: [number, number][] = [
  [50.4515, 30.5210], [50.4515, 30.5230], [50.4514, 30.5250], [50.4515, 30.5270],
  [50.4505, 30.5275], [50.4503, 30.5205], [50.4498, 30.5195], [50.4485, 30.5198],
  [50.4485, 30.5235], [50.4485, 30.5278], [50.4475, 30.5215], [50.4467, 30.5232],
  [50.4467, 30.5256], [50.4520, 30.5238], [50.4493, 30.5263],
]

export const DECO_PARCELS = DECO_SEEDS.map(([la, ln]) => makeDecoParcel(la, ln, 0.00022, 0.00028))
