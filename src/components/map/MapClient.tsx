'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Minus, Locate, Globe, Filter, X } from 'lucide-react'
import type { MapRef } from 'react-map-gl/mapbox'
import type { Parcel, MapLayers, LayerKey } from '@/types/map'
import { KYIV_CENTER, dzkToParcel } from '@/lib/mapData'
import { useMapSearch } from '@/hooks/useMapSearch'
import TopBar from '@/components/layout/TopBar'
import LeftPanel from '@/components/map/LeftPanel'
import ParcelPanel from '@/components/map/ParcelPanel'

// Mapbox GL is browser-only — dynamic import with ssr:false
const CadastralMap = dynamic(() => import('@/components/map/CadastralMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-blue">
      <span className="text-small text-gray-500">Завантаження мапи…</span>
    </div>
  ),
})

const DEFAULT_LAYERS: MapLayers = {
  cadastr: true,
  satellite: false,
}

// ── Map controls (zoom / navigate) ───────────────────────────────────
function MapControls({
  hasPanel,
  mapRef,
}: {
  hasPanel: boolean
  mapRef: React.RefObject<MapRef | null>
}) {
  const zoomIn  = () => mapRef.current?.zoomIn()
  const zoomOut = () => mapRef.current?.zoomOut()
  const flyHome = () =>
    mapRef.current?.flyTo({
      center: [KYIV_CENTER[1], KYIV_CENTER[0]],
      zoom: 17,
    })
  const flyUA = () =>
    mapRef.current?.fitBounds(
      [[22.1, 44.3], [40.2, 52.4]],
      { padding: 24 },
    )

  return (
    <div
      className={[
        'absolute bottom-6 flex flex-col gap-1.5 z-[5] transition-all duration-200',
        hasPanel ? 'right-[444px]' : 'right-6',
      ].join(' ')}
    >
      <button type="button" onClick={zoomIn}  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm transition-colors hover:bg-gray-100" aria-label="Збільшити"><Plus  size={20} strokeWidth={1.5} /></button>
      <button type="button" onClick={zoomOut} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm transition-colors hover:bg-gray-100" aria-label="Зменшити"><Minus size={20} strokeWidth={1.5} /></button>
      <div className="h-2" />
      <button type="button" onClick={flyHome} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm transition-colors hover:bg-gray-100" aria-label="Київ"><Locate  size={20} strokeWidth={1.5} /></button>
      <button type="button" onClick={flyUA}   className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm transition-colors hover:bg-gray-100" aria-label="Вся Україна"><Globe size={18} strokeWidth={1.5} /></button>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────
export default function MapClient() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [selected, setSelected]       = useState<Parcel | null>(null)
  const [layers, setLayers]           = useState<MapLayers>(DEFAULT_LAYERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Ідентифікація кліком — стан завантаження
  const [identifying, setIdentifying] = useState(false)

  const mapRef = useRef<MapRef>(null)

  // ── Fly-to helper ─────────────────────────────────────────────────
  const flyTo = useCallback((lat: number, lng: number, zoom = 17) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 })
  }, [])

  // ── Search hook ───────────────────────────────────────────────────
  const search = useMapSearch({
    onParcelFound: setSelected,
    onFlyTo: flyTo,
  })

  // Sync initial query from URL ?q= (once, after mount)
  useEffect(() => {
    if (initialQuery) search.setQuery(initialQuery)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleLayer = useCallback((key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleOrder = useCallback((_serviceId: string) => {
    // ParcelPanel handles the /api/order call directly
  }, [])

  // ── Mock parcel click (GeoJSON layer) ─────────────────────────────
  const handleSelect = useCallback((parcel: Parcel) => {
    setSelected(parcel)
    flyTo(parcel.center[0], parcel.center[1], 17)
  }, [flyTo])

  // ── WMS click -> identify via WFS ─────────────────────────────────
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (identifying) return
    setIdentifying(true)
    try {
      const res = await fetch(`/api/parcel/identify?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const info = await res.json()
        const parcel = dzkToParcel(info)
        setSelected(parcel)
        flyTo(parcel.center[0], parcel.center[1], 17)
      }
      // 404 = порожня ділянка — нічого не робимо
    } catch {
      // Network error — ignore silently
    } finally {
      setIdentifying(false)
    }
  }, [identifying, flyTo])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />

      <div className="flex flex-1 min-h-0">

        {/* ── Left panel — desktop ── */}
        <aside className="hidden md:flex w-map-left flex-shrink-0 bg-white border-r border-gray-100 flex-col overflow-hidden">
          <LeftPanel
            layers={layers}
            onToggleLayer={toggleLayer}
            search={search}
          />
        </aside>

        {/* ── Map ── */}
        <div className="flex-1 relative bg-surface-blue overflow-hidden">
          <CadastralMap
            highlightParcel={selected}
            onSelect={handleSelect}
            onMapClick={handleMapClick}
            layers={layers}
            mapRef={mapRef}
          />

          {/* Identify loading indicator */}
          {identifying && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow text-[13px] z-[10]">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse flex-shrink-0" />
              Визначаємо ділянку…
            </div>
          )}

          {/* Hint badge */}
          {!selected && (
            <div className="absolute top-6 left-6 hidden md:flex items-center gap-2 bg-white rounded px-4 py-2.5 shadow text-[13px] z-[5]">
              <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
              Клацніть будь-яку ділянку або введіть кадастровий номер
            </div>
          )}

          {/* Desktop map controls */}
          <div className="hidden md:flex">
            <MapControls hasPanel={!!selected} mapRef={mapRef} />
          </div>

          {/* Mobile search bar */}
          <div className="flex md:hidden items-center gap-2 absolute top-0 left-0 right-0 z-[5] px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
            <input
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              placeholder="Адреса або кадастровий №"
              className="h-10 flex-1 rounded border border-gray-300 pl-4 pr-3 text-small focus:border-black focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-300 bg-white transition-colors hover:bg-gray-100"
              aria-label="Фільтри"
            >
              <Filter size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Mobile zoom controls */}
          <div
            className="flex md:hidden flex-col gap-1.5 absolute right-3 z-[5]"
            style={{ bottom: selected ? 'calc(70% + 12px)' : '80px', transition: 'bottom 200ms' }}
          >
            <button type="button" onClick={() => mapRef.current?.zoomIn()}  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm"><Plus  size={20} strokeWidth={1.5} /></button>
            <button type="button" onClick={() => mapRef.current?.zoomOut()} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm"><Minus size={20} strokeWidth={1.5} /></button>
            <button type="button" onClick={() => mapRef.current?.flyTo({ center: [KYIV_CENTER[1], KYIV_CENTER[0]], zoom: 17 })} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm"><Locate size={20} strokeWidth={1.5} /></button>
          </div>
        </div>

        {/* ── Right panel — desktop ── */}
        {selected && (
          <div className="hidden md:block">
            <ParcelPanel parcel={selected} onClose={() => setSelected(null)} onOrder={handleOrder} />
          </div>
        )}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {selected && (
        <div
          className="md:hidden absolute bottom-0 left-0 right-0 h-[70%] bg-white rounded-t-2xl shadow-lg flex flex-col z-30"
          style={{ animation: 'slideUp 300ms cubic-bezier(0.2,0,0,1)' }}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ParcelPanel parcel={selected} onClose={() => setSelected(null)} onOrder={handleOrder} mobile />
          </div>
          <div className="p-3 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => handleOrder('FULL')}
              className="inline-flex h-14 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-green text-body font-medium text-white transition-colors hover:bg-green-hover"
            >
              Замовити повний звіт за 400 грн
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile filters drawer ── */}
      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/40" onClick={() => setFiltersOpen(false)}>
          <aside
            className="absolute top-0 right-0 bottom-0 w-[90%] max-w-[360px] bg-white flex flex-col shadow-lg"
            style={{ animation: 'slideInRight 250ms cubic-bezier(0.2,0,0,1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-[17px] font-bold tracking-[-0.005em]">Фільтри і шари</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded hover:bg-gray-100">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <LeftPanel
              layers={layers}
              onToggleLayer={toggleLayer}
              search={search}
            />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  )
}
