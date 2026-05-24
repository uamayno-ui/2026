type CardVariant = 'default' | 'soft' | 'blue' | 'green'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: boolean
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-300',
  soft:    'bg-surface-soft border-transparent',
  blue:    'bg-surface-blue border-transparent',
  green:   'bg-surface-green border-transparent',
}

export default function Card({
  variant = 'default',
  padding = true,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded border',
        padding && 'p-5',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
