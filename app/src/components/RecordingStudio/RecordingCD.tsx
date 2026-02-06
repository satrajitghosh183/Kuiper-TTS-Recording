/**
 * Interactive CD/vinyl player - like Framer CD component.
 * Click to drop needle and spin (recording); click again to lift needle and stop.
 */
import { motion, useReducedMotion } from 'framer-motion'

interface RecordingCDProps {
  isRecording: boolean
  onRecord: () => void
  disabled?: boolean
  className?: string
  size?: number
}

export function RecordingCD({
  isRecording,
  onRecord,
  disabled,
  className = '',
  size = 72,
}: RecordingCDProps) {
  const prefersReducedMotion = useReducedMotion()
  const isPlaying = isRecording

  return (
    <button
      type="button"
      onClick={onRecord}
      disabled={disabled}
      className={`relative cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      aria-label={isPlaying ? 'Stop recording (lift needle)' : 'Start recording (drop needle)'}
    >
      <svg viewBox="0 0 140 140" width={size} height={size} className="overflow-visible mx-auto block">
        <defs>
          <linearGradient id="rec-cd-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>

        {/* Vinyl record */}
        <motion.g
          animate={isPlaying && !prefersReducedMotion ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2.5, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
          style={{ transformOrigin: '70px 70px' }}
        >
          <circle
            cx="70"
            cy="70"
            r="58"
            fill="#1a1a1a"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <circle cx="70" cy="70" r="55" fill="url(#rec-cd-shine)" opacity="0.5" />
          <circle cx="70" cy="70" r="12" fill="#0b0d10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="70" cy="70" r="4" fill="#333" />
        </motion.g>

        {/* Center label */}
        <motion.g
          animate={isPlaying && !prefersReducedMotion ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2.5, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
          style={{ transformOrigin: '70px 70px' }}
        >
          <circle cx="70" cy="70" r="10" fill="#0b0d10" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <text
            x="70"
            y="73"
            textAnchor="middle"
            fill="var(--studio-accent)"
            fontSize="5"
            fontWeight="600"
          >
            K
          </text>
        </motion.g>

        {/* Tonearm + needle */}
        <g style={{ transformOrigin: '30px 30px' }}>
          <motion.g
            animate={{
              rotate: isPlaying ? 42 : 25,
            }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Arm base */}
            <circle cx="30" cy="30" r="6" fill="#2a2a2a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            {/* Arm */}
            <line
              x1="30"
              y1="30"
              x2={isPlaying ? 78 : 72}
              y2={isPlaying ? 68 : 62}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Needle head */}
            <circle
              cx={isPlaying ? 80 : 74}
              cy={isPlaying ? 70 : 64}
              r="2"
              fill="#333"
              stroke={isPlaying ? 'var(--studio-accent-recording)' : 'var(--studio-accent)'}
              strokeWidth="0.5"
              strokeOpacity="0.8"
            />
          </motion.g>
        </g>
      </svg>

      <p
        className="text-center mt-1 text-[10px]"
        style={{ color: 'var(--studio-text-2)' }}
      >
        {isPlaying ? 'Click to stop' : 'Click to record'}
      </p>
    </button>
  )
}
