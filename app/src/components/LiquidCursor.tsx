/**
 * Liquid cursor - fluid trail effect following the pointer.
 * Inspired by Framer Liquid Cursor. Uses canvas for smooth particle trail.
 * GPU-accelerated feel with velocity-reactive particles and smooth dissipation.
 */
import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  hue: number
}

const ACCENT_HUE = 142 // Green
const SPHERE_DISPERSION = 0.6

export function LiquidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, px: -1000, py: -1000 })
  const rafRef = useRef<number>(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMove = (e: MouseEvent) => {
      const m = mouseRef.current
      m.vx = e.clientX - m.x
      m.vy = e.clientY - m.y
      m.px = m.x
      m.py = m.y
      m.x = e.clientX
      m.y = e.clientY
      if (!isVisible) setIsVisible(true)

      const speed = Math.min(1, Math.hypot(m.vx, m.vy) / 20)
      const count = Math.max(2, Math.floor(3 + speed * 4))
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
        const r = 2 + Math.random() * 6
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 12,
          y: e.clientY + (Math.random() - 0.5) * 12,
          vx: m.vx * SPHERE_DISPERSION + Math.cos(angle) * r,
          vy: m.vy * SPHERE_DISPERSION + Math.sin(angle) * r,
          life: 0.7 + Math.random() * 0.3,
          size: 6 + Math.random() * 14 + speed * 8,
          hue: ACCENT_HUE + (Math.random() - 0.5) * 20,
        })
      }
    }

    const handleLeave = () => setIsVisible(false)

    window.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const particles = particlesRef.current

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.94
        p.vy *= 0.94
        p.life -= 0.015
        p.size *= 0.97

        if (p.life <= 0 || p.size < 1.5) {
          particles.splice(i, 1)
          continue
        }

        const alpha = p.life * 0.5
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5)
        gradient.addColorStop(0, `hsla(${p.hue}, 70%, 55%, ${alpha * 0.6})`)
        gradient.addColorStop(0.4, `hsla(${p.hue}, 65%, 50%, ${alpha * 0.25})`)
        gradient.addColorStop(0.8, `hsla(${p.hue}, 60%, 45%, ${alpha * 0.08})`)
        gradient.addColorStop(1, 'hsla(142, 60%, 45%, 0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [isVisible])

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden
    />
  )
}
