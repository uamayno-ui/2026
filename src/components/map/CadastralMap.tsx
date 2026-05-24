'use client'

import { useRef, useCallback } from 'react'
import Map, {
  Source, Layer, NavigationControl, GeolocateControl,
} from 'react-map-gl/mapbox'
import type { MapRef, MapLayerMouseEvent, LayerProps } from 'react-map-gl/mapbox'
import { ExternalLink } from 'lucide-react'
import type { Parcel, MapLayers } from '@/types/map'
import { PARCELS, DECO_PARCELS, KYIV_CENTER, parcelsToGeoJSON, decoToGeoJSON } from '@/lib/mapData'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export interface CadastralMapProps {
  selectedId: string | null
  onSelect: (p: Parcel) => void
  layers: MapLayers
  mapRef?: React.RefObject<MapRef | null>
}

// ── Layer definitions ─────────────────────────────────────────────────

const DECO_FILL: LayerProps = {
  id: 'deco-fill',
  type: 'fill',
  source: 'deco',
  paint: { 'fill-color': '#0A0A0A', 'fill-opacity': 0.04 },
}
const DECO_LINE: LayerProps = {
  id: 'deco-line',
  type: 'line',
  source: 'deco',
  paint: { 'line-color': '#0A0A0A', 'line-width': 0.8, 'line-opacity': 0.25 },
}
const FILL_BASE: LayerProps = {
  id: 'parcels-fill',
  type: 'fill',
  source: 'parcels',
  paint: { 'fill-color': '#0A0A0A', 'fill-opacity': 0.07 },
}
const LINE_BASE: LayerProps = {
  id: 'parcels-line',
  type: 'line',
  source: 'parcels',
  paint: { 'line-color': '#0A0A0A', 'line-width': 1, 'line-opacity': 0.35 },
}
const FILL_SEL: LayerProps = {
  id: 'parcels-fill-sel',
  type: 'fill',
  source: 'parcels',
  paint: { 'fill-color': '#22C55E', 'fill-opacity': 0.28 },
}
const LINE_SEL: LayerProps = {
  id: 'parcels-line-sel',
  type: 'line',
  source: 'parcels',
  paint: { 'line-color': '#22C55E', 'line-width': 2.5 },
}
const WMS_LAYER: LayerProps = {
  id: 'cadastral-wms',
  type: 'raster',
  source: 'cadastral-wms',
  paint: { 'raster-opacity': 0.55 },
}

// ── No-token placeholder ──────────────────────────────────────────────
function NoToken() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-surface-soft">
      <div className="text-center max-w-xs px-6">
        <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
          <ExternalLink size={20} strokeWidth={1.5} className="text-gray-400" />
        </div>
        <p className="text-[15px] font-semibold mb-2">Mapbox токен не налаштовано</p>
        <p className="text-[13px] text-gray-500 mb-4 leading-5">
          Додайте{' '}
          <code className="font-mono bg-white border border-gray-200 px-1 rounded text-[12px]">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{' '}
          у{' '}
          <code className="font-mono bg-white border border-gray-200 px-1 rounded text-[12px]">
            .env.local
          </code>
        </p>
        <a
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-black text-white text-small font-medium no-underline hover:bg-black-hover transition-colors"
        >
          Отримати токен →
        </a>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────
export default function CadastralMap({
  selectedId,
  onSelect,
  layers,
  mapRef,
}: CadastralMapProps) {
  const internalRef = useRef<MapRef>(null)
  const ref = (mapRef ?? internalRef) as React.RefObject<MapRef>

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined
      const found = PARCELS.find((p) => p.id === id)
      if (found) onSelect(found)
    },
    [onSelect],
  )

  if (!TOKEN) return <NoToken />

  const mapStyle = layers.satellite
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/light-v11'

  // Filter: show selected highlight layer only on the matching parcel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selFilter: any = selectedId
    ? ['==', ['get', 'id'], selectedId]
    : ['boolean', false]

  const parcelsGeoJSON = parcelsToGeoJSON(PARCELS)
  const decoGeoJSON = decoToGeoJSON(DECO_PARCELS)

  return (
    <Map
      ref={ref}
      mapboxAccessToken={TOKEN}
      initialViewState={{
        longitude: KYIV_CENTER[1], // KYIV_CENTER = [lat, lng] → Mapbox uses lng first
        latitude:  KYIV_CENTER[0],
        zoom: 14,
      }}
      mapStyle={mapStyle}
      style={{ width: '100%', height: '100%' }}
      interactiveLayerIds={['parcels-fill']}
      onClick={handleClick}
    >
      {/* ── Cadastral WMS overlay ── */}
      {layers.cadastr && (
        <>
          <Source
            id="cadastral-wms"
            type="raster"
            tiles={[
              // Через власний proxy-роут — обходить CORS обмеження map.land.gov.ua
              '/api/wms' +
              '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1' +
              '&LAYERS=kadastr&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true' +
              '&HEIGHT=256&WIDTH=256&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}',
            ]}
            tileSize={256}
          />
          <Layer {...WMS_LAYER} />
        </>
      )}

      {/* ── Decorative background parcels ── */}
      <Source id="deco" type="geojson" data={decoGeoJSON}>
        <Layer {...DECO_FILL} />
        <Layer {...DECO_LINE} />
      </Source>

      {/* ── Interactive parcels ── */}
      <Source id="parcels" type="geojson" data={parcelsGeoJSON}>
        <Layer {...FILL_BASE} />
        <Layer {...LINE_BASE} />
        <Layer {...FILL_SEL} filter={selFilter} />
        <Layer {...LINE_SEL} filter={selFilter} />
      </Source>

      <NavigationControl position="top-right" showCompass={false} />
      <GeolocateControl position="top-right" />
    </Map>
  )
}
