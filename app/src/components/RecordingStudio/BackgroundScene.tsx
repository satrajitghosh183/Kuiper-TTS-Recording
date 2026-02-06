import { ReactNode } from 'react'

type SceneMode = 'studio' | 'desk'

interface BackgroundSceneProps {
  mode: SceneMode
  children: ReactNode
}

export function BackgroundScene({ mode, children }: BackgroundSceneProps) {
  return (
    <div
      data-scene={mode}
      className="min-h-full w-full flex flex-col items-center justify-center py-8 px-4 transition-colors duration-500 relative"
      style={
        mode === 'studio'
          ? {
              background:
                'linear-gradient(180deg, var(--studio-bg-0) 0%, var(--studio-bg-1) 50%, var(--studio-bg-0) 100%)',
            }
          : {
              background:
                'linear-gradient(165deg, #2d2419 0%, #3d3225 30%, #4a3d2e 60%, #3d3225 100%)',
              position: 'relative',
            }
      }
    >
      {/* Studio: abstract rack/mic silhouette */}
      {mode === 'studio' && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-[0.03]"
            style={{
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute top-1/4 right-0 w-64 h-64 opacity-[0.02]"
            style={{
              background: 'linear-gradient(135deg, white 0%, transparent 100%)',
            }}
          />
          {/* Grid lines hint */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.02]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}

      {/* Desk: sunlight streak + shadow under card */}
      {mode === 'desk' && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute top-0 left-0 w-full h-1/2 opacity-20"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,240,200,0.15) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-8 opacity-30"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-0 w-full flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
