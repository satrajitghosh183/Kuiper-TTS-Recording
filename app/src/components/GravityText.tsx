/**
 * Gravity Text - letters react to mouse with physics-based gravity effect.
 * Inspired by Framer Gravity Text: https://www.framer.com/marketplace/components/gravity-text/
 */
import { useRef, useCallback, useMemo, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

interface GravityTextProps {
  children: string
  className?: string
  style?: React.CSSProperties
  /** Radius (px) within which cursor affects letters */
  gravityRadius?: number
  /** Strength of pull toward cursor (0–1) */
  gravityStrength?: number
  /** Transform: uppercase, lowercase, etc. */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
}

export function GravityText({
  children,
  className = '',
  style,
  gravityRadius = 120,
  gravityStrength = 0.35,
  textTransform = 'none',
}: GravityTextProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLSpanElement>(null)

  const mouseX = useMotionValue(-9999)
  const mouseY = useMotionValue(-9999)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left - rect.width / 2)
      mouseY.set(e.clientY - rect.top - rect.height / 2)
    },
    [mouseX, mouseY, prefersReducedMotion]
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-9999)
    mouseY.set(-9999)
  }, [mouseX, mouseY])

  const chars = useMemo(() => children.split(''), [children])

  if (prefersReducedMotion) {
    return (
      <span className={className} style={{ textTransform, ...style }}>
        {children}
      </span>
    )
  }

  return (
    <span
      ref={containerRef}
      className={`inline-flex flex-wrap ${className}`}
      style={{ textTransform, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {chars.map((char, i) => (
        <GravityLetter
          key={`${i}-${char}`}
          char={char}
          mouseX={mouseX}
          mouseY={mouseY}
          gravityRadius={gravityRadius}
          gravityStrength={gravityStrength}
        />
      ))}
    </span>
  )
}

function GravityLetter({
  char,
  mouseX,
  mouseY,
  gravityRadius,
  gravityStrength,
}: {
  char: string
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  gravityRadius: number
  gravityStrength: number
}) {
  const letterRef = useRef<HTMLSpanElement>(null)
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const springX = useSpring(offsetX, { stiffness: 200, damping: 20 })
  const springY = useSpring(offsetY, { stiffness: 200, damping: 20 })

  useEffect(() => {
    const el = letterRef.current
    const parent = el?.parentElement
    if (!el || !parent) return

    const unsubX = mouseX.on('change', (mx) => {
      const my = mouseY.get()
      if (mx < -9000) {
        offsetX.set(0)
        offsetY.set(0)
        return
      }
      const rect = el.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()
      const lx = rect.left - parentRect.left + rect.width / 2 - parentRect.width / 2
      const ly = rect.top - parentRect.top + rect.height / 2 - parentRect.height / 2
      const dx = mx - lx
      const dy = my - ly
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < gravityRadius && dist > 0) {
        const falloff = 1 - dist / gravityRadius
        const pull = falloff * falloff * gravityStrength
        offsetX.set((dx / dist) * pull * 80)
        offsetY.set((dy / dist) * pull * 80)
      } else {
        offsetX.set(0)
        offsetY.set(0)
      }
    })

    const unsubY = mouseY.on('change', (my) => {
      const mx = mouseX.get()
      if (mx < -9000) {
        offsetX.set(0)
        offsetY.set(0)
        return
      }
      const rect = el.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()
      const lx = rect.left - parentRect.left + rect.width / 2 - parentRect.width / 2
      const ly = rect.top - parentRect.top + rect.height / 2 - parentRect.height / 2
      const dx = mx - lx
      const dy = my - ly
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < gravityRadius && dist > 0) {
        const falloff = 1 - dist / gravityRadius
        const pull = falloff * falloff * gravityStrength
        offsetX.set((dx / dist) * pull * 80)
        offsetY.set((dy / dist) * pull * 80)
      } else {
        offsetX.set(0)
        offsetY.set(0)
      }
    })

    return () => {
      unsubX()
      unsubY()
    }
  }, [mouseX, mouseY, offsetX, offsetY, gravityRadius, gravityStrength])

  const isSpace = char === ' '
  if (isSpace) {
    return <span className="inline-block" style={{ width: '0.25em' }} aria-hidden />
  }

  return (
    <motion.span
      ref={letterRef}
      className="inline-block"
      style={{ x: springX, y: springY }}
    >
      {char}
    </motion.span>
  )
}
