import { useRef, useCallback, useState } from 'react'

interface ProgressBumpProps {
  current: number
  total: number
  onSeek: (index: number) => void
  elapsedSeconds?: number
  remainingSeconds?: number
  remainingLines?: number
}

/**
 * Deterministic SVG path: flat line with a gentle bump near left-center.
 * Path: M 0,mid -> slight rise -> peak at ~35% -> gentle fall -> L width,mid
 */
function buildBumpPath(width: number, height: number): string {
  const mid = height / 2
  const peakX = width * 0.35
  const peakY = mid - 10
  const ctrl1X = width * 0.12
  const ctrl2X = width * 0.58
  return `M 0 ${mid} Q ${ctrl1X} ${mid - 8}, ${peakX} ${peakY} Q ${ctrl2X} ${peakY}, ${width} ${mid}`
}

export function ProgressBump({
  current,
  total,
  onSeek,
  elapsedSeconds = 0,
  remainingSeconds = 0,
  remainingLines = 0,
}: ProgressBumpProps) {
  const trackRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const width = 400
  const height = 24

  const progress = total > 0 ? Math.min(1, current / Math.max(1, total)) : 0
  const knobX = progress * width

  const pathD = buildBumpPath(width, height)

  const getIndexFromX = useCallback(
    (clientX: number) => {
      const svg = trackRef.current
      if (!svg) return 0
      const rect = svg.getBoundingClientRect()
      const x = (clientX - rect.left) / rect.width
      const clamped = Math.max(0, Math.min(1, x))
      return Math.round(clamped * total)
    },
    [total]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const idx = getIndexFromX(e.clientX)
      onSeek(Math.min(idx, total - 1))
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [getIndexFromX, onSeek, total]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const idx = getIndexFromX(e.clientX)
      onSeek(Math.max(0, Math.min(idx, total - 1)))
    },
    [isDragging, getIndexFromX, onSeek, total]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(false)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onSeek(Math.max(0, current - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onSeek(Math.min(total - 1, current + 1))
      }
    },
    [current, total, onSeek]
  )

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full">
      <div className="flex justify-between text-[14px] text-[var(--studio-text-2)] mb-2">
        <span>{formatTime(elapsedSeconds)}</span>
        <span>
          Line {current + 1} of {total}
          {remainingLines > 0 && ` · ${remainingLines} left`}
        </span>
        <span>-{formatTime(remainingSeconds)}</span>
      </div>
      <div className="relative" style={{ height: 32 }}>
        <svg
          ref={trackRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="slider"
          aria-label="Seek to phrase"
          aria-valuemin={0}
          aria-valuemax={total - 1}
          aria-valuenow={current}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <defs>
            <linearGradient id="progressGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--studio-text-0)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--studio-text-2)" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          {/* Full track (dim) */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--studio-text-2)"
            strokeWidth={2}
            strokeOpacity={0.3}
          />
          {/* Progress segment (revealed portion) */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={2}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${progress} ${1 - progress}`}
            strokeDashoffset={0}
            style={{ transition: isDragging ? 'none' : 'stroke-dasharray 0.15s ease' }}
          />
          {/* Knob */}
          <g transform={`translate(${knobX}, ${height / 2})`}>
            <circle
              r={8}
              fill="var(--studio-text-1)"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
            <circle r={6} fill="var(--studio-text-0)" />
          </g>
        </svg>
      </div>
    </div>
  )
}
