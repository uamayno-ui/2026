'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2, MapPin, Hash, AlertCircle, Info } from 'lucide-react'
import type { SearchSuggestion } from '@/hooks/useMapSearch'

const KADNUM_RE = /^\d{10}:\d{2}:\d{3}:\d{4}$/

interface SearchBoxProps {
  value:       string
  onChange:    (v: string) => void
  suggestions: SearchSuggestion[]
  searching:   boolean
  error:       string | null
  hint?:       string | null
  onSelect:    (s: SearchSuggestion) => void
  onClear:     () => void
  placeholder?: string
  className?:  string
}

export default function SearchBox({
  value, onChange, suggestions, searching, error, hint,
  onSelect, onClear, placeholder = 'Адреса або кадастровий номер', className = '',
}: SearchBoxProps) {
  const [focused,    setFocused]   = useState(false)
  const [activeIdx,  setActiveIdx] = useState(-1)
  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)

  const isKadnumValue = KADNUM_RE.test(value.trim())
  const showDropdown = focused && (suggestions.length > 0 || !!error || !!hint)

  // Reset active index on new suggestions
  useEffect(() => { setActiveIdx(-1) }, [suggestions])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      onSelect(suggestions[activeIdx])
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      onClear()
      inputRef.current?.blur()
    }
  }, [showDropdown, suggestions, activeIdx, onSelect, onClear])

  return (
    <div className={['relative', className].join(' ')}>
      {/* Input */}
      <div className="relative">
        <span className={[
          'absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none z-[1] transition-colors duration-150',
          focused ? 'text-[#22C55E]' : 'text-gray-400',
        ].join(' ')}>
          {searching
            ? <Loader2 size={17} strokeWidth={1.5} className="animate-spin" />
            : <Search  size={17} strokeWidth={1.5} />}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={[
            'w-full h-[44px] pl-[40px] pr-[36px] bg-white border rounded transition-all duration-150',
            'caret-[#22C55E]',   // зелений мигаючий курсор при введенні
            'focus:outline-none',
            isKadnumValue ? 'font-mono text-[12px] tracking-normal' : 'font-sans text-small',
            focused
              ? 'border-black border-[1.5px] shadow-[0_0_0_4px_rgba(212,212,216,0.4)]'
              : 'border-gray-300 hover:border-gray-500',
          ].join(' ')}
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(''); onClear() }}
            className="absolute right-[10px] top-1/2 flex h-[20px] w-[20px] -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
            aria-label="Очистити"
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[50] overflow-hidden">
          {suggestions.length > 0 && (
            <ul ref={listRef} role="listbox" className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {suggestions.map((s, i) => (
                <li
                  key={s.id}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={(e) => { e.preventDefault(); onSelect(s) }}
                  className={[
                    'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors text-[13px]',
                    i === activeIdx ? 'bg-surface-soft' : 'hover:bg-surface-soft',
                  ].join(' ')}
                >
                  <span className="mt-0.5 flex-shrink-0 text-gray-400">
                    {s.type === 'parcel'
                      ? <Hash size={15} strokeWidth={1.5} />
                      : <MapPin size={15} strokeWidth={1.5} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    {s.type === 'parcel' ? (
                      <>
                        <span className="font-mono font-medium text-black">{s.label}</span>
                        {s.parcel && (
                          <span className="block text-[11px] text-gray-500 mt-0.5 truncate">
                            {s.parcel.region} · {s.parcel.area} · {s.parcel.purpose}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="leading-snug text-gray-700">{s.label}</span>
                        {s.sub && (
                          <span className="block text-[11px] text-gray-400 mt-0.5 truncate">{s.sub}</span>
                        )}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {hint && !error && (
            <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-gray-500">
              <Info size={15} strokeWidth={1.5} className="flex-shrink-0 text-info" />
              {hint}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-gray-500">
              <AlertCircle size={15} strokeWidth={1.5} className="flex-shrink-0 text-danger" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
