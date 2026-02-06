/**
 * Liquid button - jelly-like surface, cursor-following ripple, click physics.
 */
import { useRef, useState, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface LiquidButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function LiquidButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className = '',
  type = 'button',
}: LiquidButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const clickIdRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    setRipple({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => setRipple(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect && !prefersReducedMotion) {
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      clickIdRef.current += 1
      setClickRipple({ x, y, id: clickIdRef.current })
      setTimeout(() => setClickRipple(null), 700)
    }
    onClick?.()
  }

  const baseClass = 'relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium rounded-2xl cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2'
  const variants = {
    primary: 'bg-[var(--studio-accent)] text-[var(--studio-bg-0)] px-6 py-3',
    secondary: 'bg-[var(--studio-glass-apple)] border border-[var(--studio-border-apple)] text-[var(--studio-text-0)] px-6 py-3',
    ghost: 'bg-transparent text-[var(--studio-text-1)] px-6 py-3 hover:text-[var(--studio-text-0)]',
  }

  const springConfig = prefersReducedMotion
    ? { type: 'tween' as const, duration: 0.15 }
    : { type: 'spring' as const, stiffness: 240, damping: 12 }

  return (
    <motion.button
      ref={btnRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${baseClass} ${variants[variant]} ${className}`}
      whileHover={
        disabled
          ? {}
          : prefersReducedMotion
            ? { scale: 1.02 }
            : { scaleX: 1.03, scaleY: 0.98 }
      }
      whileTap={
        disabled
          ? {}
          : prefersReducedMotion
            ? { scale: 0.98 }
            : { scaleX: 0.96, scaleY: 1.04 }
      }
      transition={springConfig}
    >
      {/* Cursor-following liquid highlight - pronounced blur */}
      {ripple && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 65%)',
              filter: 'blur(20px)',
            }}
          />
        </motion.div>
      )}
      {/* Click ripple - liquid physics expansion */}
      {clickRipple && !prefersReducedMotion && (
        <motion.span
          key={clickRipple.id}
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
          initial={{
            opacity: 0.8,
            scale: 0,
          }}
          animate={{
            opacity: 0,
            scale: 3,
          }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            background: `radial-gradient(circle at ${clickRipple.x}% ${clickRipple.y}%, rgba(255,255,255,0.5) 0%, transparent 60%)`,
            transformOrigin: `${clickRipple.x}% ${clickRipple.y}%`,
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
