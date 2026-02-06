/**
 * Liquid metal icon - metallic shader effect wrapper for icons.
 * Inspired by Framer Liquid Metal Icon.
 */
import { ReactNode } from 'react'

interface LiquidMetalIconProps {
  children: ReactNode
  className?: string
  size?: number
}

export function LiquidMetalIcon({ children, className = '', size = 24 }: LiquidMetalIconProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.2) 100%)',
          filter: 'blur(1px)',
        }}
      />
      <div
        className="relative z-10 flex items-center justify-center [&>svg]:shrink-0"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
        }}
      >
        {children}
      </div>
    </div>
  )
}
