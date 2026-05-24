'use client'

import { forwardRef } from 'react'

type Variant = 'black' | 'green' | 'secondary' | 'ghost'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  black:
    'bg-black text-white hover:bg-black-hover active:bg-black-press active:scale-[0.98]',
  green:
    'bg-green text-white hover:bg-green-hover active:bg-green-press active:scale-[0.98]',
  secondary:
    'bg-transparent text-black border border-[1.5px] border-black hover:bg-surface-soft active:bg-surface-blue',
  ghost:
    'bg-transparent text-black hover:bg-gray-100 active:bg-gray-300',
}

const sizeClasses: Record<Size, string> = {
  xs: 'h-8 px-3 text-small',
  sm: 'h-10 px-4 text-small',
  md: 'h-12 px-6 text-body',
  lg: 'h-14 px-8 text-body-l',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'black', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center justify-center gap-2',
          'font-sans font-medium rounded-full',
          'whitespace-nowrap cursor-pointer',
          'transition-all duration-fast ease-ease',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
