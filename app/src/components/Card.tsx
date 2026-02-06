import { forwardRef, ReactNode } from 'react'

interface CardProps {
  children?: ReactNode
  variant?: 'default' | 'elevated'
  hoverable?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hoverable = false, className = '', style: styleProp, onClick }, ref) => {
    const baseStyle: React.CSSProperties = {
      background: 'var(--studio-glass-apple)',
      backdropFilter: 'saturate(180%) blur(40px)',
      WebkitBackdropFilter: 'saturate(180%) blur(40px)',
      border: '1px solid var(--studio-border-apple)',
      borderRadius: 'var(--studio-card-radius)',
      padding: 'var(--studio-padding)',
      boxShadow: variant === 'elevated'
        ? '0 24px 48px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
        : '0 12px 24px -8px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
    }
    return (
      <div
        ref={ref}
        className={`
          relative overflow-hidden transition-all duration-200
          ${hoverable ? 'cursor-pointer hover:-translate-y-0.5' : ''}
          ${className}
        `}
        style={{ ...baseStyle, ...styleProp }}
        onClick={onClick}
      >
        {/* Subtle noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.02,
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)

Card.displayName = 'Card'

