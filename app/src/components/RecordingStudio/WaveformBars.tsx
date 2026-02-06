import { useRef, useEffect, useState } from 'react'

interface WaveformBarsProps {
  level: number
  isRecording: boolean
  barCount?: number
  className?: string
}

export function WaveformBars({
  level,
  isRecording,
  barCount = 32,
  className = '',
}: WaveformBarsProps) {
  const barsRef = useRef<number[]>(new Array(barCount).fill(0))
  const [bars, setBars] = useState<number[]>(new Array(barCount).fill(0))
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const update = () => {
      const next = [...barsRef.current]
      if (isRecording) {
        for (let i = 0; i < barCount - 1; i++) {
          next[i] = next[i + 1]
        }
        const noise = Math.random() * 0.15 - 0.05
        next[barCount - 1] = Math.min(1, Math.max(0.05, level + noise))
      } else {
        next[barCount - 1] = next[barCount - 1] * 0.92
      }
      barsRef.current = next
      setBars(next)
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [level, isRecording, barCount])

  const height = 48
  const barWidth = 4
  const gap = 2
  const totalWidth = barCount * (barWidth + gap) - gap

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      width="100%"
      height={height}
      className={className}
      aria-hidden
    >
      {bars.map((val, i) => {
        const h = Math.max(4, val * (height - 8))
        const x = i * (barWidth + gap)
        const y = (height - h) / 2
        const fill =
          isRecording && val > 0.1
            ? 'var(--studio-accent-recording)'
            : 'var(--studio-text-2)'
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={2}
            fill={fill}
            opacity={val > 0.05 ? 0.9 : 0.3}
          />
        )
      })}
    </svg>
  )
}
