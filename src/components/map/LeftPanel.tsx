'use client'

import { useState } from 'react'
import { Globe, Satellite, ChevronDown, Ruler, Route, Download } from 'lucide-react'
import type { MapLayers, LayerKey } from '@/types/map'
import type { UseMapSearchReturn } from '@/hooks/useMapSearch'
import SearchBox from '@/components/map/SearchBox'

// ── Re-export hook type so MapClient can pass it ───────────────────────
export type { UseMapSearchReturn as MapSearchHook }

interface LeftPanelProps {
  layers:         MapLayers
  onToggleLayer:  (key: LayerKey) => void
  search:         UseMapSearchReturn
}

const LAYER_CONFIG: { key: LayerKey; icon: React.ReactNode; label: string }[] = [
  { key: 'cadastr',   icon: <Globe    size={18} strokeWidth={1.5} />, label: 'Кадастр'  },
  { key: 'satellite', icon: <Satellite size={18} strokeWidth={1.5} />, label: 'Супутник' },
]

const PURPOSES = ['Житло', 'ОСГ', 'Комерційна', 'Громадська']

function Section({ title, defaultOpen = false, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-[13px] font-medium uppercase tracking-[0.04em] text-black bg-transparent cursor-pointer"
      >
        {title}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={['transition-transform duration-200', open ? 'rotate-0' : '-rotate-90'].join(' ')}
        />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onToggle() }}
      className={[
        'relative w-9 h-5 rounded-full border-0 cursor-pointer flex-shrink-0',
        'transition-colors duration-fast',
        active ? 'bg-black' : 'bg-gray-300',
      ].join(' ')}
      aria-pressed={active}
    >
      <span className={[
        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-fast',
        active ? 'left-[18px]' : 'left-0.5',
      ].join(' ')} />
    </button>
  )
}

function ToggleRow({ icon, label, active, onToggle }: {
  icon: React.ReactNode; label: string; active: boolean; onToggle: () => void
}) {
  return (
    <label className="flex items-center gap-3 px-5 py-2 cursor-pointer text-small text-black hover:bg-surface-soft transition-colors">
      <span className="text-gray-500">{icon}</span>
      <span className="flex-1">{label}</span>
      <Toggle active={active} onToggle={onToggle} />
    </label>
  )
}

export default function LeftPanel({ layers, onToggleLayer, search }: LeftPanelProps) {
  return (
    <>
      {/* Search box з dropdown */}
      <div className="px-4 py-4 border-b border-gray-100">
        <SearchBox
          value={search.query}
          onChange={search.setQuery}
          suggestions={search.suggestions}
          searching={search.searching}
          error={search.error}
          onSelect={search.selectSuggestion}
          onClear={search.clearResults}
        />
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1">
        <Section title="Шари мапи" defaultOpen>
          {LAYER_CONFIG.map(({ key, icon, label }) => (
            <ToggleRow key={key} icon={icon} label={label} active={layers[key]} onToggle={() => onToggleLayer(key)} />
          ))}
        </Section>

        <Section title="Фільтри">
          <div className="px-5 pb-4 flex flex-col gap-4">
            <div>
              <div className="text-tiny uppercase text-gray-500 mb-2">Цільове призначення</div>
              <div className="flex flex-wrap gap-1.5">
                {PURPOSES.map((t) => (
                  <button key={t} type="button" className="h-8 px-3 text-[13px] font-medium border border-gray-300 bg-white rounded-full cursor-pointer hover:border-black transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-tiny uppercase text-gray-500 mb-2">Площа</div>
              <div className="flex gap-2">
                <input placeholder="від" className="flex-1 h-9 px-3 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-black" />
                <input placeholder="до" className="flex-1 h-9 px-3 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-black" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Інструменти">
          <div className="px-2 pb-3">
            {[
              { icon: <Ruler   size={18} strokeWidth={1.5} />, label: 'Вимірювання площі' },
              { icon: <Route   size={18} strokeWidth={1.5} />, label: 'Вимірювання відстані' },
              { icon: <Download size={18} strokeWidth={1.5} />, label: 'Експорт обраного' },
            ].map(({ icon, label }) => (
              <button key={label} type="button" className="flex items-center gap-2.5 w-full h-10 px-3 text-[14px] text-black rounded hover:bg-surface-soft transition-colors">
                <span className="text-gray-500">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Footer stat */}
      <div className="px-5 py-3.5 border-t border-gray-100 text-[12px] text-gray-500">
        Замовлено за тиждень:{' '}
        <span className="font-mono text-black font-medium">1 247</span> запитів
      </div>
    </>
  )
}
