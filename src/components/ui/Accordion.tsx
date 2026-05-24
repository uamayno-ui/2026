'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionItem {
  q: string
  a: string
}

interface AccordionProps {
  items: AccordionItem[]
}

export default function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex items-center justify-between w-full py-5 text-left text-[17px] font-semibold text-black hover:text-black/80 transition-colors"
          >
            {item.q}
            <ChevronDown
              size={20}
              strokeWidth={1.5}
              className={['flex-shrink-0 ml-4 text-gray-500 transition-transform duration-200', open === i ? 'rotate-180' : ''].join(' ')}
            />
          </button>
          {open === i && (
            <div className="pb-5 text-[15px] leading-6 text-gray-500">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
