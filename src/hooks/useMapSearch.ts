'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Parcel } from '@/types/map'
import { dzkToParcel } from '@/lib/mapData'

// Регекс для кадастрового номера: XXXXXXXXXX:XX:XXX:XXXX
const KADNUM_RE = /^\d{10}:\d{2}:\d{3}:\d{4}$/

export interface SearchSuggestion {
  id:    string | number
  label: string
  lat:   number
  lng:   number
  type:  'address' | 'parcel'
  parcel?: Parcel     // якщо type === 'parcel'
}

export interface UseMapSearchReturn {
  query:        string
  setQuery:     (v: string) => void
  suggestions:  SearchSuggestion[]
  searching:    boolean
  error:        string | null
  clearResults: () => void
  selectSuggestion: (s: SearchSuggestion) => void
  // Коли вибрано ділянку — зовнішній обробник її отримує
  onParcelFound?: (p: Parcel) => void
  onFlyTo?:       (lat: number, lng: number, zoom?: number) => void
}

export function useMapSearch({
  onParcelFound,
  onFlyTo,
}: {
  onParcelFound?: (p: Parcel) => void
  onFlyTo?:       (lat: number, lng: number, zoom?: number) => void
} = {}): UseMapSearchReturn {
  const [query,       setQueryRaw]   = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searching,   setSearching]  = useState(false)
  const [error,       setError]      = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef    = useRef<AbortController | null>(null)

  const clearResults = useCallback(() => {
    setSuggestions([])
    setError(null)
  }, [])

  const setQuery = useCallback((v: string) => {
    setQueryRaw(v)
    if (!v.trim()) {
      clearResults()
      return
    }
  }, [clearResults])

  // Основний ефект: реагуємо на зміну query
  useEffect(() => {
    const q = query.trim()
    if (!q) { clearResults(); return }

    // Скасуємо попередній pending запит
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    // Кадастровий номер — шукаємо одразу (без debounce)
    if (KADNUM_RE.test(q)) {
      setSearching(true)
      setError(null)
      const ctrl = new AbortController()
      abortRef.current = ctrl

      ;(async () => {
        try {
          const res = await fetch(`/api/parcel?kadnum=${encodeURIComponent(q)}`, { signal: ctrl.signal })
          if (res.status === 404) {
            setSuggestions([])
            setError('Ділянку з таким номером не знайдено в ДЗК')
            return
          }
          if (!res.ok) throw new Error('Помилка запиту')
          const info = await res.json()
          const parcel = dzkToParcel(info)
          setSuggestions([{
            id:    parcel.kadnum,
            label: parcel.kadnum,
            lat:   parcel.center[0],
            lng:   parcel.center[1],
            type:  'parcel',
            parcel,
          }])
          setError(null)
          // Одразу вибираємо знайдену ділянку
          onParcelFound?.(parcel)
          onFlyTo?.(parcel.center[0], parcel.center[1], 17)
        } catch (e) {
          if ((e as Error).name !== 'AbortError') {
            setError('Помилка пошуку. Спробуйте ще раз.')
          }
        } finally {
          setSearching(false)
        }
      })()
      return
    }

    // Адреса — debounce 400ms
    if (q.length < 3) { clearResults(); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setError(null)
      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error()
        const results = await res.json() as {
          id: number; label: string; lat: number; lng: number; type: string
        }[]
        setSuggestions(results.map((r) => ({
          id:    r.id,
          label: r.label,
          lat:   r.lat,
          lng:   r.lng,
          type:  'address' as const,
        })))
        if (results.length === 0) setError('Адресу не знайдено')
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('Помилка пошуку')
        }
      } finally {
        setSearching(false)
      }
    }, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const selectSuggestion = useCallback((s: SearchSuggestion) => {
    if (s.parcel) {
      onParcelFound?.(s.parcel)
    }
    onFlyTo?.(s.lat, s.lng, s.type === 'parcel' ? 17 : 14)
    setQueryRaw(s.type === 'parcel' ? s.label : s.label.split(',')[0].trim())
    setSuggestions([])
  }, [onParcelFound, onFlyTo])

  return {
    query, setQuery,
    suggestions, searching, error,
    clearResults, selectSuggestion,
    onParcelFound, onFlyTo,
  }
}
