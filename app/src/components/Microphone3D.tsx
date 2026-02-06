/**
 * 3D-style microphone graphic - metallic, sculptural, premium.
 * SVG with gradients and shadows for a rendered look.
 */
interface Microphone3DProps {
  className?: string
  size?: number
}

export function Microphone3D({ className = '', size = 280 }: Microphone3DProps) {
  return (
    <svg
      viewBox="0 0 280 320"
      width={size}
      height={size * (320 / 280)}
      className={className}
      aria-hidden
    >
      <defs>
        {/* Metallic gradient - head grille */}
        <linearGradient id="mic-head" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="25%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="50%" stopColor="rgba(0,0,0,0.15)" />
          <stop offset="75%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
        {/* Body cylinder gradient */}
        <linearGradient id="mic-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="20%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="80%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
        </linearGradient>
        {/* Accent highlight - green glow */}
        <radialGradient id="mic-accent" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="var(--studio-accent)" stopOpacity="0.4" />
          <stop offset="70%" stopColor="var(--studio-accent)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--studio-accent)" stopOpacity="0" />
        </radialGradient>
        {/* Filter for depth */}
        <filter id="mic-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.5)" />
        </filter>
      </defs>

      {/* Soft shadow */}
      <ellipse cx="140" cy="305" rx="55" ry="10" fill="rgba(0,0,0,0.25)" />

      <g filter="url(#mic-soft-shadow)">
        {/* Microphone head - capsule/grille shape */}
        <ellipse
          cx="140"
          cy="85"
          rx="65"
          ry="45"
          fill="url(#mic-head)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        {/* Inner grille detail */}
        <ellipse cx="140" cy="85" rx="55" ry="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Accent glow overlay */}
        <ellipse cx="140" cy="75" rx="60" ry="40" fill="url(#mic-accent)" opacity="0.6" />

        {/* Body - cylindrical stem */}
        <rect
          x="115"
          y="125"
          width="50"
          height="140"
          rx="4"
          fill="url(#mic-body)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Body highlight strip */}
        <line
          x1="122"
          y1="130"
          x2="122"
          y2="260"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />

        {/* Base - stand mount */}
        <path
          d="M 95 265 L 140 285 L 185 265 L 185 275 L 140 295 L 95 275 Z"
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Base accent */}
        <path
          d="M 100 268 L 140 288 L 180 268"
          fill="none"
          stroke="var(--studio-accent)"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  )
}
