'use client'

import { forwardRef } from 'react'

type InputSize = 'md' | 'lg' | 'hero'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize
}

const sizeClasses: Record<InputSize, string> = {
  md:   'h-12 px-4 text-body',
  lg:   'h-14 px-4 text-body',
  hero: 'h-16 px-6 text-body-l',
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={[
          'w-full bg-white text-black font-sans',
          'border border-gray-300 rounded',
          'placeholder:text-gray-500',
          'transition-all duration-fast ease-ease',
          'hover:border-gray-500',
          'focus:outline-none focus:border-black focus:border-[1.5px]',
          'focus:ring-4 focus:ring-gray-300/40',
          sizeClasses[inputSize],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
