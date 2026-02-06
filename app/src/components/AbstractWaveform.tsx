/**
 * Abstract waveform with glow and physics-like flowing animation.
 * Organic, fluid motion with soft glow effect.
 */
interface AbstractWaveformProps {
  className?: string
  size?: number
}

export function AbstractWaveform({ className = '', size = 280 }: AbstractWaveformProps) {
  const w = size
  const h = size * 0.9
  const cy = h / 2

  const buildPath = (phase: number, amp: number, freq: number) => {
    const points: string[] = []
    const steps = 80
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2
      const x = w * 0.05 + (i / steps) * w * 0.9
      const y =
        cy +
        Math.sin(t * freq + phase) * amp * 0.4 +
        Math.sin(t * 2.3 + phase * 0.7) * amp * 0.2 +
        Math.sin(t * 0.7 + phase * 1.3) * amp * 0.15
      points.push(`${x},${y}`)
    }
    return `M ${points.join(' L ')}`
  }

  return (
    <div className={`abstract-waveform-float ${className}`}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
        <defs>
          <filter id="waveform-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.2  0 1 0 0 0.84  0 0 0 0 0.29  0 0 0 0.85 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="waveform-glow-outer" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur2" />
            <feColorMatrix
              in="blur2"
              type="matrix"
              values="0 0 0 0 0.2  0 1 0 0 0.84  0 0 0 0 0.29  0 0 0 0.35 0"
              result="glow2"
            />
            <feMerge>
              <feMergeNode in="glow2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#waveform-glow-outer)">
          <path
            d={buildPath(0, h * 0.38, 1.2)}
            fill="none"
            stroke="var(--studio-accent)"
            strokeWidth="2"
            strokeOpacity="0.45"
            className="waveform-flow"
          />
          <path
            d={buildPath(Math.PI * 0.5, h * 0.32, 1.5)}
            fill="none"
            stroke="var(--studio-accent)"
            strokeWidth="1.5"
            strokeOpacity="0.35"
            className="waveform-flow waveform-flow-2"
          />
          <path
            d={buildPath(Math.PI, h * 0.26, 0.9)}
            fill="none"
            stroke="var(--studio-accent)"
            strokeWidth="1"
            strokeOpacity="0.3"
            className="waveform-flow waveform-flow-3"
          />
        </g>

        <g filter="url(#waveform-glow)">
          <path
            d={buildPath(0, h * 0.38, 1.2)}
            fill="none"
            stroke="var(--studio-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="waveform-flow"
          />
          <path
            d={buildPath(Math.PI * 0.33, h * 0.3, 1.8)}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            className="waveform-flow waveform-flow-2"
          />
        </g>
      </svg>
    </div>
  )
}
