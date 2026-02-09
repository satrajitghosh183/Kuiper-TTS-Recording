import { useState, useRef, useEffect, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    setPosition(spaceAbove >= spaceBelow ? 'top' : 'bottom')
  }, [visible])

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          style={{
            [position === 'top' ? 'bottom' : 'top']: '100%',
            [position === 'top' ? 'marginBottom' : 'marginTop']: '8px',
            background: 'var(--studio-glass-strong)',
            border: '1px solid var(--studio-border-apple)',
            color: 'var(--studio-text-0)',
            boxShadow: 'var(--studio-shadow-outer)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
