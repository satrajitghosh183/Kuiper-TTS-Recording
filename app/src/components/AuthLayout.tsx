import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  loading?: boolean
}

/**
 * Full-page layout for auth pages (Login, SignUp) with video background.
 */
export function AuthLayout({ children, loading = false }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Top loading bar - full width, above form, animates left to right */}
      {loading && (
        <div
          className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden"
          role="progressbar"
          aria-valuenow={loading ? undefined : 0}
          aria-label="Loading"
        >
          <div
            className="block h-full min-w-0 rounded-r-full"
            style={{
              background: 'var(--studio-accent)',
              animation: 'loadingBar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}
      {/* Video background - full screen, looping, muted */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden
      >
        <source src="/startup-bg.mp4" type="video/mp4" />
      </video>

      {/* Black overlay - dark theme */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--studio-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--studio-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
