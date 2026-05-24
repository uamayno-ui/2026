'use client'

import { ArrowRight } from 'lucide-react'

interface TileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
}

export default function Tile({ icon, children, className = '', ...props }: TileProps) {
  return (
    <button
      type="button"
      className={[
        'flex items-center justify-between w-full',
        'h-20 px-6',
        'bg-white text-black',
        'border border-[1.5px] border-black rounded',
        'font-sans text-body font-medium',
        'cursor-pointer',
        'transition-all duration-fast ease-ease',
        'hover:bg-surface-soft active:scale-[0.99]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span className="flex items-center gap-3">
        {icon}
        {children}
      </span>
      <ArrowRight size={24} strokeWidth={1.5} />
    </button>
  )
}
