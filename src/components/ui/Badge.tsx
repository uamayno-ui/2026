type BadgeVariant = 'default' | 'green' | 'soft' | 'mono'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-black',
  green:   'bg-green text-white',
  soft:    'bg-surface-soft text-black',
  mono:    'bg-gray-100 text-black font-mono',
}

export default function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center',
        'h-7 px-3 rounded-full',
        'text-small font-medium',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
