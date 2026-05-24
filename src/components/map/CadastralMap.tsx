'use client'

import { useEffect, useRef } from 'react'
import type { MapLayers, Parcel } from '@/types/map'
import { PARCELS, DECO_PARCELS, KYIV_CENTER, UA_BOUNDS } from '@/lib/mapData'

// Leaflet is browser-only — this component is always dynamically imported with ssr:false

interface CadastralMapProps {
  selectedId: string | null
  onSelect: (parcel: Parcel) => void
  layers: MapLayers
  onMapReady?: (map: L.Map) => void
}

export default function CadastralMap({ selectedId, onSelect, layers, onMapReady }: CadastralMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseLayerRef = useRef<L.TileLayer | null>(null)
  const cadastrLayerRef = useRef<L.LayerGroup | null>(null)
  const decoLayerRef = useRef<L.LayerGroup | null>(null)

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')

    const map = L.map(containerRef.current, {
      center: KYIV_CENTER,
      zoom: 18,
      minZoom: 6,
      maxZoom: 19,
      maxBounds: UA_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: true,
    })

    L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 120 }).addTo(map)
    mapRef.current = map
    ;(window as Window & { __maynoMap?: L.Map }).__maynoMap = map
    onMapReady?.(map)

    return () => {
      map.remove()
      mapRef.current = null
      delete (window as Window & { __maynoMap?: L.Map }).__maynoMap
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Tile layer — switches on satellite toggle
  useEffect(() => {
    if (!mapRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    const map = mapRef.current
    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current)

    const url = layers.satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const attr = layers.satellite ? 'Esri · World Imagery' : '© OpenStreetMap'

    baseLayerRef.current = L.tileLayer(url, { maxZoom: 19, attribution: attr }).addTo(map)
  }, [layers.satellite])

  // Cadastral parcels
  useEffect(() => {
    if (!mapRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    const map = mapRef.current

    if (cadastrLayerRef.current) { map.removeLayer(cadastrLayerRef.current); cadastrLayerRef.current = null }
    if (decoLayerRef.current) { map.removeLayer(decoLayerRef.current); decoLayerRef.current = null }
    if (!layers.cadastr) return

    // Decorative non-interactive background parcels
    const deco = L.layerGroup()
    DECO_PARCELS.forEach((poly) => {
      L.polygon(poly as [number, number][], {
        color: '#0A0A0A', weight: 1, opacity: 0.4,
        fillColor: '#0A0A0A', fillOpacity: 0,
        interactive: false,
      }).addTo(deco)
    })
    deco.addTo(map)
    decoLayerRef.current = deco

    // Interactive parcels
    const grp = L.layerGroup()
    PARCELS.forEach((p) => {
      const isSelected = selectedId === p.id
      const baseStyle = {
        color: isSelected ? '#22C55E' : '#0A0A0A',
        weight: isSelected ? 2.5 : 1,
        opacity: isSelected ? 1 : 0.7,
        fillColor: isSelected ? '#22C55E' : '#0A0A0A',
        fillOpacity: isSelected ? 0.4 : 0,
      }
      const poly = L.polygon(p.polygon, baseStyle)
      poly.bindTooltip(p.kadnum, { className: 'mayno-tooltip', direction: 'top', offset: [0, -4] })
      poly.on('click', () => onSelect(p))
      poly.on('mouseover', () => { if (selectedId !== p.id) poly.setStyle({ fillOpacity: 0.12, weight: 1.5 }) })
      poly.on('mouseout', () => poly.setStyle(baseStyle))
      poly.addTo(grp)
    })
    grp.addTo(map)
    cadastrLayerRef.current = grp
  }, [layers.cadastr, layers.satellite, selectedId, onSelect])

  return <div ref={containerRef} className="absolute inset-0 z-[1]" />
}
