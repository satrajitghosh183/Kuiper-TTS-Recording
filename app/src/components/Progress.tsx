import { motion } from 'framer-motion'

interface ProgressProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export function Progress({ 
  value, 
  size = 'md', 
  showLabel = false, 
  label,
  className = '' 
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center">
          <span className="text-caption" style={{ color: 'var(--studio-text-1)' }}>
            {label || 'Progress'}
          </span>
          <span className="text-caption font-mono" style={{ color: 'var(--studio-text-2)' }}>
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden ${heights[size]}`} style={{ background: 'var(--studio-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--studio-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  )
}

