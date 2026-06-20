'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Parcel } from '@/types/map'
import { dzkToParcel } from '@/lib/mapData'

// Повний кадастровий номер: XXXXXXXXXX:XX:XXX:XXXX
const KADNUM_RE = /^\d{10}:\d{2}:\d{3}:\d{4}$/

// Частковий — тільки цифри (юзер ще не ввів двокрапки)
const DIGITS_RE = /^\d+$/
const CADASTRAL_INPUT_RE = /^[\d:\s]+$/
const KADNUM_FORMAT_HINT = 'Введіть кадастровий номер у форматі XXXXXXXXXX:XX:XXX:XXXX'

/**
 * Авто-форматування: "2310100000010010025" → "2310100000:01:001:0025"
 * Приймає рядок з цифрами і двокрапками, виділяє тільки цифри і форматує.
 */
export function formatKadnumInput(raw: string): string {
  const d = raw.replace(/\D/g, '') // тільки цифри
  if (d.length === 0) return ''
  if (d.length <= 10) return d
  let r = d.slice(0, 10)
  if (d.length > 10) r += ':' + d.slice(10, 12)
  if (d.length > 12) r += ':' + d.slice(12, 15)
  if (d.length > 15) r += ':' + d.slice(15, 19)
  return r
}

export interface SearchSuggestion {
  id:     string | number
  label:  string
  sub?:   string   // підпис (місто/район) — для адрес
  lat:    number
  lng:    number
  type:   'address' | 'parcel'
  parcel?: Parcel
}

export interface UseMapSearchReturn {
  query:            string
  setQuery:         (v: string) => void
  suggestions:      SearchSuggestion[]
  searching:        boolean
  error:            string | null
  hint:             string | null   // підказка формату (не помилка)
  clearResults:     () => void
  selectSuggestion: (s: SearchSuggestion) => void
  onParcelFound?:   (p: Parcel) => void
  onFlyTo?:         (lat: number, lng: number, zoom?: number) => void
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
  const [hint,        setHint]       = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef    = useRef<AbortController | null>(null)

  const clearResults = useCallback(() => {
    setSuggestions([])
    setError(null)
    setHint(null)
  }, [])

  const setQuery = useCallback((v: string) => {
    setQueryRaw(v)
    if (!v.trim()) clearResults()
  }, [clearResults])

  // Основний ефект: реагуємо на зміну query
  useEffect(() => {
    const q = query.trim()
    if (!q) { clearResults(); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    // ── Повний кадастровий номер → WFS ──────────────────────────────
    if (KADNUM_RE.test(q)) {
      setSearching(true)
      setError(null)
      setHint(null)
      const ctrl = new AbortController()
      abortRef.current = ctrl

      ;(async () => {
        try {
          const res = await fetch(`/api/parcel?kadnum=${encodeURIComponent(q)}`, {
            signal: ctrl.signal,
          })
          if (res.status === 404) {
            setSuggestions([])
            setError('Не знайшли ділянку на мапі. Перевірте формат кадастрового номера або уточніть дані.')
            return
          }
          if (!res.ok) throw new Error('Помилка запиту')
          const info = await res.json()
          if (!Array.isArray(info.center) || !Array.isArray(info.polygon) || info.polygon.length < 3) {
            setSuggestions([])
            setError('Не знайшли ділянку на мапі. Перевірте формат кадастрового номера або уточніть дані.')
            return
          }
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

    // ── Частковий або невалідний кадастровий ввід → підказка ───────
    if (DIGITS_RE.test(q) || (CADASTRAL_INPUT_RE.test(q) && q.replace(/\D/g, '').length >= 4)) {
      clearResults()
      if (q.replace(/\D/g, '').length >= 4) {
        setHint(KADNUM_FORMAT_HINT)
      }
      return
    }

    // ── Адреса — debounce 400ms ──────────────────────────────────────
    if (q.length < 3) { clearResults(); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setError(null)
      setHint(null)
      const ctrl = new AbortController()
      abortRef.current = ctrl

      // 8-секундний таймаут (Nominatim може бути повільним)
      const timer = setTimeout(() => ctrl.abort(), 8000)

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        clearTimeout(timer)
        if (!res.ok) throw new Error()
        const results = await res.json() as {
          id: number; label: string; short?: string; sub?: string
          lat: number; lng: number; type: string
        }[]
        setSuggestions(results.map((r) => ({
          id:    r.id,
          label: r.short ?? r.label.split(',')[0].trim(),
          sub:   r.sub,
          lat:   r.lat,
          lng:   r.lng,
          type:  'address' as const,
        })))
        if (results.length === 0) setError('Не знайшли адресу. Спробуйте додати місто або область.')
      } catch (e) {
        clearTimeout(timer)
        if ((e as Error).name !== 'AbortError') {
          setError('Помилка пошуку. Перевірте зʼєднання.')
        } else {
          setError('Пошук зайняв надто довго. Спробуйте ще раз.')
        }
      } finally {
        setSearching(false)
      }
    }, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const selectSuggestion = useCallback((s: SearchSuggestion) => {
    if (s.parcel) onParcelFound?.(s.parcel)
    // Адреса → zoom 17 (рівень будинку), ділянка → 17 (вже є)
    onFlyTo?.(s.lat, s.lng, 17)
    setQueryRaw(s.label)
    setSuggestions([])
    setHint(null)
  }, [onParcelFound, onFlyTo])

  return {
    query, setQuery,
    suggestions, searching, error, hint,
    clearResults, selectSuggestion,
    onParcelFound, onFlyTo,
  }
}
