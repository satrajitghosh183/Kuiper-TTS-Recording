/**
 * Interactive vinyl player - realistic grooves, plays classical jazz when playing.
 * Click to drop needle and spin; click again to lift needle and stop.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Golden Whisper jazz - local asset (served from public/)
const JAZZ_AUDIO_URL = '/notaigenerated-background-jazz-golden-whisper-358520.mp3'

interface VinylPlayerProps {
  className?: string
  size?: number
}

export function VinylPlayer({ className = '', size = 260 }: VinylPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleClick = useCallback(() => {
    const next = !isPlaying
    setIsPlaying(next)

    const audio = audioRef.current
    if (!audio) return

    if (next) {
      // Play immediately in click handler - required by browser autoplay policy
      audio.play().catch(() => {})
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  return (
    <div
      className={`relative cursor-pointer select-none ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={isPlaying ? 'Stop (lift needle)' : 'Play (drop needle)'}
    >
      <audio
        ref={audioRef}
        src={JAZZ_AUDIO_URL}
        preload="auto"
        loop
        playsInline
      />
      <svg viewBox="0 0 280 280" width={size} height={size} className="overflow-visible drop-shadow-2xl">
        <defs>
          <linearGradient id="vinyl-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.12)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          <radialGradient id="vinyl-edge" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#080808" />
            <stop offset="88%" stopColor="#0d0d0d" />
            <stop offset="96%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#2a2a2a" />
          </radialGradient>
          <radialGradient id="vinyl-label" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1d22" />
            <stop offset="70%" stopColor="#0d0f12" />
            <stop offset="100%" stopColor="#08090b" />
          </radialGradient>
          <filter id="vinyl-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Turntable platter - matte surface beneath vinyl */}
        <circle
          cx="140"
          cy="140"
          r="122"
          fill="#0a0a0a"
          stroke="rgba(80,80,80,0.4)"
          strokeWidth="1"
        />

        {/* Vinyl record - realistic with grooves */}
        <motion.g
          filter="url(#vinyl-shadow)"
          animate={
            isPlaying && !prefersReducedMotion
              ? {
                  rotate: 360,
                  scale: [1, 1.002, 0.998, 1],
                }
              : { rotate: 0, scale: 1 }
          }
          transition={{
            rotate: { duration: 3.2, repeat: isPlaying ? Infinity : 0, ease: 'linear' },
            scale: { duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: '140px 140px' }}
        >
          {/* Main disc - dark vinyl */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="url(#vinyl-edge)"
            stroke="rgba(60,60,60,0.8)"
            strokeWidth="1.5"
          />
          {/* Shine overlay */}
          <circle cx="140" cy="140" r="118" fill="url(#vinyl-shine)" opacity="0.6" />
          {/* Grooves - fine concentric circles for realism */}
          {Array.from({ length: 52 }).map((_, i) => {
            const r = 32 + (i * 88) / 52
            return (
              <circle
                key={i}
                cx="140"
                cy="140"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth={i % 5 === 0 ? 0.35 : 0.2}
              />
            )
          })}
          {/* Inner label area - paper texture */}
          <circle cx="140" cy="140" r="32" fill="url(#vinyl-label)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="140" cy="140" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        </motion.g>

        {/* Center label - spins with record */}
        <motion.g
          animate={isPlaying && !prefersReducedMotion ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3.2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
          style={{ transformOrigin: '140px 140px' }}
        >
          <circle cx="140" cy="140" r="26" fill="url(#vinyl-label)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <text
            x="140"
            y="142"
            textAnchor="middle"
            fill="var(--studio-accent)"
            fontSize="8"
            fontWeight="700"
            letterSpacing="2"
          >
            KUYPER
          </text>
          <text
            x="140"
            y="150"
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="5"
            letterSpacing="1"
          >
            TTS
          </text>
        </motion.g>

        {/* Center spindle - fixed, doesn't spin */}
        <g>
          <circle cx="140" cy="140" r="6" fill="#1a1a1a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="140" cy="140" r="3" fill="#0a0a0a" />
        </g>

        {/* Tonearm + needle - realistic pivot */}
        <g style={{ transformOrigin: '55px 55px' }}>
          <motion.g
            animate={{
              rotate: isPlaying ? 40 : 22,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Arm base - pivot housing */}
            <circle cx="55" cy="55" r="14" fill="#252525" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="55" cy="55" r="10" fill="#1a1a1a" />
            {/* Tonearm tube */}
            <line
              x1="55"
              y1="55"
              x2={isPlaying ? 158 : 148}
              y2={isPlaying ? 138 : 128}
              stroke="rgba(200,200,200,0.2)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1="55"
              y1="55"
              x2={isPlaying ? 158 : 148}
              y2={isPlaying ? 138 : 128}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Needle head */}
            <circle
              cx={isPlaying ? 161 : 151}
              cy={isPlaying ? 141 : 131}
              r="5"
              fill="#2a2a2a"
              stroke="var(--studio-accent)"
              strokeWidth="1"
              strokeOpacity="0.8"
            />
          </motion.g>
        </g>
      </svg>

      <p
        className="text-center mt-2 text-xs"
        style={{ color: 'var(--studio-text-2)' }}
      >
        {isPlaying ? 'Click to stop' : 'Click to play'}
      </p>
    </div>
  )
}
