'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2, MapPin, Hash, AlertCircle, Info } from 'lucide-react'
import type { SearchSuggestion } from '@/hooks/useMapSearch'

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
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-[1]">
          {searching
            ? <Loader2 size={17} strokeWidth={1.5} className="animate-spin text-gray-400" />
            : <Search size={17} strokeWidth={1.5} />}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)} // delay to allow click on list
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full h-11 pl-10 pr-9 text-small bg-white border border-gray-300 rounded hover:border-gray-500 focus:outline-none focus:border-black focus:border-[1.5px] transition-colors"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(''); onClear() }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
            aria-label="Очистити"
          >
            <X size={13} strokeWidth={2} />
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
              <Info size={15} strokeWidth={1.5} className="flex-shrink-0 text-blue-400" />
              {hint}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-gray-500">
              <AlertCircle size={15} strokeWidth={1.5} className="flex-shrink-0 text-orange-400" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
