/**
 * Button with liquid physics - jelly deformation, click ripple, cursor-following highlight.
 */
import { forwardRef, ReactNode, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ButtonProps {
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  title?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    type = 'button',
    onClick,
    title,
  }, ref) => {
    const btnRef = useRef<HTMLButtonElement>(null)
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
    const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null)
    const clickIdRef = useRef(0)
    const prefersReducedMotion = useReducedMotion()

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      setRipple({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }
    const handleMouseLeave = () => setRipple(null)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return
      const rect = btnRef.current?.getBoundingClientRect()
      if (rect && !prefersReducedMotion) {
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        clickIdRef.current += 1
        setClickRipple({ x, y, id: clickIdRef.current })
        setTimeout(() => setClickRipple(null), 600)
      }
      onClick?.()
    }

    const baseStyles = `
      relative overflow-hidden inline-flex items-center justify-center gap-2
      font-medium rounded-2xl
      cursor-pointer select-none
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--studio-bg-0)]
    `

    const variants = {
      primary: 'bg-[var(--studio-accent)] text-[var(--studio-bg-0)] hover:brightness-110',
      secondary: 'bg-[var(--studio-glass-apple)] border border-[var(--studio-border-apple)] text-[var(--studio-text-0)] hover:bg-[var(--studio-glass-strong)] hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)]',
      ghost: 'bg-transparent text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] hover:bg-[var(--studio-glass)]',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-caption',
      md: 'px-6 py-3 text-body',
      lg: 'px-8 py-4 text-body-lg',
    }

    const springConfig = prefersReducedMotion
      ? { type: 'tween' as const, duration: 0.15 }
      : { type: 'spring' as const, stiffness: 260, damping: 14 }

    return (
      <motion.button
        ref={(node) => {
          (btnRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type={type}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        title={title}
        whileHover={
          disabled || isLoading
            ? {}
            : prefersReducedMotion
              ? {}
              : { scale: 1.02, scaleX: 1.02, scaleY: 0.99 }
        }
        whileTap={
          disabled || isLoading
            ? {}
            : prefersReducedMotion
              ? { scale: 0.98 }
              : { scaleX: 0.97, scaleY: 1.03 }
        }
        transition={springConfig}
      >
        {/* Cursor-following liquid highlight */}
        {ripple && !prefersReducedMotion && (
          <span
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{
              background: `radial-gradient(circle 80px at ${ripple.x}% ${ripple.y}%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)`,
            }}
          />
        )}
        {/* Click ripple - expands from point */}
        {clickRipple && !prefersReducedMotion && (
          <motion.span
            key={clickRipple.id}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            initial={{
              opacity: 0.6,
              background: `radial-gradient(circle at ${clickRipple.x}% ${clickRipple.y}%, rgba(255,255,255,0.5) 0%, transparent 0%)`,
            }}
            animate={{
              opacity: 0,
              background: `radial-gradient(circle 150% at ${clickRipple.x}% ${clickRipple.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <span className="relative z-10">{children}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
