'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Mic } from 'lucide-react'

const SUGGESTIONS = [
  { label: 'Київ, вул. Хрещатик, 1', sub: 'Адреса · Центральний р-н' },
  { label: 'Львів, Площа Ринок, 14', sub: 'Адреса · Галицький р-н' },
  { label: '6310136900:12:001:0025', sub: 'Кадастровий номер · Харків', mono: true },
  { label: 'Запоріжжя, Незалежної України, 40', sub: 'Адреса' },
]

interface SearchInputProps {
  size?: 'md' | 'hero'
  placeholder?: string
}

export default function SearchInput({
  size = 'hero',
  placeholder = 'Введіть адресу або кадастровий номер',
}: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = SUGGESTIONS.filter(
    (s) => !query || s.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSearch = (q: string) => {
    const val = q || query || SUGGESTIONS[0].label
    setOpen(false)
    router.push(`/map?q=${encodeURIComponent(val)}`)
  }

  const inputHeight = size === 'hero' ? 'h-16' : 'h-12'
  const inputPx = size === 'hero' ? 'pl-5 pr-2' : 'pl-4 pr-2'
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
          open
            ? 'border-black border-[1.5px] rounded-t rounded-b-none shadow-[0_0_0_4px_rgba(212,212,216,0.4)]'
            : 'border-gray-300 rounded',
        ].join(' ')}
      >
        <Search size={22} strokeWidth={1.5} className="text-gray-500 shrink-0" />

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(query) }}
          placeholder={placeholder}
          className={[
            'flex-1 min-w-0 h-full',
            'bg-transparent border-0 outline-none',
            'font-sans placeholder:text-gray-500',
            inputFontSize,
          ].join(' ')}
          aria-label="Пошук нерухомості"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Голосовий пошук"
        >
          <Mic size={20} strokeWidth={1.5} className="text-gray-500" />
        </button>

        <button
          type="button"
          onClick={() => handleSearch(query)}
          className="shrink-0 inline-flex items-center justify-center h-10 px-5 rounded-full bg-black text-white text-small font-medium hover:bg-black-hover active:bg-black-press active:scale-[0.98] transition-all duration-fast whitespace-nowrap"
        >
          Знайти
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full bg-white border-[1.5px] border-t-0 border-black rounded-b shadow-lg py-2 z-10">
          {filtered.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setQuery(s.label); handleSearch(s.label) }}
              className="flex items-center gap-4 w-full px-5 py-3 text-left hover:bg-surface-soft transition-colors"
            >
              <MapPin size={18} strokeWidth={1.5} className="text-gray-500 shrink-0" />
              <div>
                <div className={['text-[15px] font-medium text-black', s.mono ? 'font-mono' : ''].join(' ')}>
                  {s.label}
                </div>
                <div className="text-[13px] text-gray-500 mt-0.5">{s.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
