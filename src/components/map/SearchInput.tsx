'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Hash, X, Loader } from 'lucide-react'

// Регекс для кадастрового номера: XXXXXXXXXX:XX:XXX:XXXX
const KADNUM_RE = /^\d{10}:\d{2}:\d{3}:\d{4}$/

interface Suggestion {
  id:           number | string
  label:        string   // повна назва (передається у URL)
  displayLabel: string   // скорочена для відображення у dropdown
  sub:          string
  lat:          number
  lng:          number
  isKadnum?:    boolean
}

interface SearchInputProps {
  size?:        'md' | 'hero'
  placeholder?: string
}

export default function SearchInput({
  size = 'hero',
  placeholder = 'Введіть адресу або кадастровий номер',
}: SearchInputProps) {
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)

  const router     = useRouter()
  const inputRef   = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // ── Fetch suggestions ────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error()
      const results = await res.json() as {
        id: number; label: string; lat: number; lng: number
      }[]
      setSuggestions(results.map((r) => {
        // display_name: "вулиця Хрещатик, Печерський р-н, Київ, ..."
        const parts = r.label.split(',').map((p: string) => p.trim())
        const displayLabel = parts[0] ?? r.label
        const sub = parts.slice(1, 3).filter(Boolean).join(', ') || 'Україна'
        return {
          id: r.id,
          label: r.label,
          displayLabel,
          sub,
          lat: r.lat,
          lng: r.lng,
        }
      }))
      setOpen(true)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ── React to query changes ──────────────────────────────────────────
  useEffect(() => {
    const q = query.trim()
    if (!q) { setSuggestions([]); setOpen(false); return }

    setActiveIdx(-1)

    // Кадастровий номер — одразу переходимо, не потрібен пошук
    if (KADNUM_RE.test(q)) {
      setSuggestions([{
        id: q, label: q, displayLabel: q, sub: 'Кадастровий номер', lat: 0, lng: 0, isKadnum: true,
      }])
      setOpen(true)
      return
    }

    if (q.length < 3) { setSuggestions([]); setOpen(false); return }

    // Debounce 350ms для адрес
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 350)
  }, [query, fetchSuggestions])

  // ── Navigate to map ─────────────────────────────────────────────────
  const navigate = useCallback((q: string) => {
    const val = q.trim() || query.trim()
    if (!val) return
    setOpen(false)
    router.push(`/map?query=${encodeURIComponent(val)}`)
  }, [query, router])

  // ── Keyboard navigation ─────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter') navigate(query); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        const s = suggestions[activeIdx]
        setQuery(s.displayLabel)
        navigate(s.label)
      } else {
        navigate(query)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  const handleSelect = (s: Suggestion) => {
    setQuery(s.displayLabel)  // показуємо скорочену версію в input
    navigate(s.label)         // передаємо повну назву в URL
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    inputRef.current?.focus()
  }

  // ── Styles ───────────────────────────────────────────────────────────
  const inputHeight   = size === 'hero' ? 'h-[64px]' : 'h-[48px]'
  const inputPx       = size === 'hero' ? 'pl-5 pr-2' : 'pl-4 pr-2'
  const inputFontSize = size === 'hero' ? 'text-body-l' : 'text-body'

  return (
    <div className="relative max-w-[720px] mx-auto">
      {/* Search box */}
      <div
        className={[
          'flex items-center gap-2',
          inputHeight,
          inputPx,
          'bg-white',
          'border transition-all duration-fast',
          open && suggestions.length > 0
            ? 'border-black border-[1.5px] rounded-t rounded-b-none shadow-[0_0_0_4px_rgba(212,212,216,0.4)]'
            : 'border-gray-300 rounded',
        ].join(' ')}
      >
        <span className={[
          'transition-colors duration-150 shrink-0',
          query ? 'text-[#22C55E]' : 'text-gray-400',
        ].join(' ')}>
          {loading
            ? <Loader size={22} strokeWidth={1.5} className="animate-spin" />
            : <Search size={22} strokeWidth={1.5} />}
        </span>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          onBlur={() => setTimeout(() => { setOpen(false); setActiveIdx(-1) }, 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={[
            'flex-1 min-w-0 h-full',
            'bg-transparent border-0 outline-none',
            'font-sans placeholder:text-gray-500',
            'caret-[#22C55E]',
            inputFontSize,
          ].join(' ')}
          aria-label="Пошук нерухомості"
          aria-autocomplete="list"
          aria-expanded={open}
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleClear() }}
            className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded transition-colors hover:bg-gray-100"
            aria-label="Очистити"
          >
            <X size={16} strokeWidth={1.5} className="text-gray-400" />
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate(query)}
          className="shrink-0 inline-flex items-center justify-center h-[48px] px-6 rounded-full bg-black text-white text-small font-medium hover:bg-black-hover active:bg-black-press active:scale-[0.98] transition-all duration-fast whitespace-nowrap"
        >
          Знайти
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full bg-white border-[1.5px] border-t-0 border-black rounded-b shadow-lg py-2 z-10"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
                onMouseEnter={() => setActiveIdx(i)}
                className={[
                  'inline-flex min-h-[48px] w-full shrink-0 items-center gap-4 px-5 py-3 text-left transition-colors',
                  i === activeIdx ? 'bg-surface-soft' : 'hover:bg-surface-soft',
                ].join(' ')}
              >
                {s.isKadnum
                  ? <Hash    size={18} strokeWidth={1.5} className="text-green shrink-0" />
                  : <MapPin  size={18} strokeWidth={1.5} className="text-gray-500 shrink-0" />
                }
                <div>
                  <div className={[
                    'text-[15px] font-medium text-black leading-tight',
                    s.isKadnum ? 'font-mono' : '',
                  ].join(' ')}>
                    {s.displayLabel}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">{s.sub}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
