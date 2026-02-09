import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Loader2,
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { LiquidButton, GravityText } from '../components'
import { LiquidMetalIcon } from '../components/LiquidMetalIcon'
import { VinylPlayer } from '../components/VinylPlayer'
import { api, type RecordingProgress, type Script } from '../lib/api'

/** Physics card: mouse-follow tilt, subtle float, spring transitions */
function PhysicsCard({
  children,
  className = '',
  floatIntensity = 6,
}: {
  children: React.ReactNode
  className?: string
  floatIntensity?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [floatIntensity, -floatIntensity]))
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-floatIntensity, floatIntensity]))

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || prefersReducedMotion) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const relX = (e.clientX - cx) / (rect.width / 2)
      const relY = (e.clientY - cy) / (rect.height / 2)
      mouseX.set(Math.max(-1, Math.min(1, relX)))
      mouseY.set(Math.max(-1, Math.min(1, relY)))
    },
    [mouseX, mouseY, prefersReducedMotion]
  )
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformPerspective: 1000,
      }}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              y: [0, -4, 0],
              transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }
      }
    >
      {children}
    </motion.div>
  )
}

export function Welcome() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null)
  const [progress, setProgress] = useState<RecordingProgress[]>([])
  const [scripts, setScripts] = useState<Script[]>([])

  useEffect(() => {
    let mounted = true
    const checkServer = async () => {
      try {
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => { if (mounted) resolve(false) }, 5000)
        })
        const checkPromise = api.listScripts().then(() => true).catch(() => false)
        const available = await Promise.race([checkPromise, timeoutPromise])
        if (mounted) setServerAvailable(available)
      } catch {
        if (mounted) setServerAvailable(false)
      }
    }
    checkServer()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (serverAvailable) {
      api.listScripts()
        .then(async (loaded) => {
          setScripts(loaded)
          try {
            const p = await api.getRecordingProgress()
            setProgress(p)
          } catch {
            setProgress([])
          }
        })
        .catch(() => setScripts([]))
    }
  }, [serverAvailable])

  // Use progress when available; otherwise build from scripts (0 recorded each)
  const displayProgress: RecordingProgress[] =
    progress.length > 0
      ? progress
      : scripts.map((s) => ({
          script_id: s.id,
          script_name: s.name,
          recorded: 0,
          total: s.line_count,
          remaining: s.line_count,
          percent: 0,
        }))

  const totalRecorded = displayProgress.reduce((sum, p) => sum + p.recorded, 0)
  const totalLines = displayProgress.reduce((sum, p) => sum + p.total, 0)

  // Server not available
  if (serverAvailable === false) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <WifiOff size={64} className="mb-6" style={{ color: 'var(--studio-accent-recording)' }} />
        <h1 className="text-h1 mb-3" style={{ color: 'var(--studio-text-0)' }}>Server Not Available</h1>
        <p className="text-body-lg mb-8 max-w-md" style={{ color: 'var(--studio-text-1)' }}>
          The Kuyper TTS backend server is not responding. Please check that the server is running.
        </p>
        <LiquidButton
          variant="primary"
          onClick={async () => {
            setServerAvailable(null)
            const available = await api.listScripts().then(() => true).catch(() => false)
            setServerAvailable(available)
          }}
        >
          <LiquidMetalIcon size={18}>
            <RefreshCw size={18} />
          </LiquidMetalIcon>
          Retry Connection
        </LiquidButton>
      </div>
    )
  }

  // Loading
  if (serverAvailable === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <LiquidMetalIcon size={48} className="mb-4">
          <Loader2 size={48} className="animate-spin" style={{ color: 'var(--studio-accent)' }} />
        </LiquidMetalIcon>
        <p className="text-body-lg" style={{ color: 'var(--studio-text-1)' }}>Connecting to server...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] -mx-xl -my-lg overflow-hidden">
      {/* Subtle grid - optional slow drift for depth */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--studio-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--studio-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.08,
        }}
        animate={
          prefersReducedMotion
            ? undefined
            : { backgroundPosition: ['0px 0px', '40px 40px', '0px 0px'] }
        }
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      {/* Floating orbs for depth and atmosphere */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, var(--studio-accent) 0%, transparent 70%)',
              opacity: 0.06,
            }}
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, var(--studio-accent) 0%, transparent 70%)',
              opacity: 0.05,
            }}
            animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Top row - tagline with gravity effect */}
        <div className="mb-16">
          <GravityText
            className="text-sm font-medium tracking-[0.2em] block"
            style={{ color: 'var(--studio-text-2)' }}
            textTransform="uppercase"
            gravityRadius={100}
            gravityStrength={0.3}
          >
            Accessibility, powered by voice
          </GravityText>
        </div>

        {/* Main content - grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left - Interactive vinyl player with physics */}
          <div
            className="lg:col-span-5 flex justify-center lg:justify-center order-2 lg:order-1 min-h-[50vh] lg:min-h-[60vh] items-center pt-4 lg:pt-0"
          >
            <PhysicsCard className="w-full max-w-[320px]" floatIntensity={4}>
              <div className="studio-card p-8 rounded-3xl flex flex-col items-center justify-center">
                <VinylPlayer size={260} />
              </div>
            </PhysicsCard>
          </div>

          {/* Right - Copy + Stats with physics (tilt, float, spring) */}
          <PhysicsCard className="lg:col-span-7 order-1 lg:order-2" floatIntensity={6}>
            <motion.div
              className="studio-card rounded-3xl p-8"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6"
              style={{
                color: 'var(--studio-text-0)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              <GravityText
                gravityRadius={140}
                gravityStrength={0.25}
              >
                Meet Kuyper.
              </GravityText>
            </h1>
            <p
              className="text-body-lg max-w-xl mb-12 leading-relaxed"
              style={{ color: 'var(--studio-text-1)' }}
            >
              <GravityText gravityRadius={90} gravityStrength={0.2}>
                {`Kuyper TTS is an open-source text-to-speech system that helps researchers read papers aloud. Your voice recordings train the model—every clip you contribute makes `}
              </GravityText>
              <span style={{ color: 'var(--studio-accent)' }}>
                <GravityText gravityRadius={90} gravityStrength={0.2}>research more accessible</GravityText>
              </span>
              .
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 md:gap-12 mb-12">
              <div>
                <p className="text-3xl font-semibold" style={{ color: 'var(--studio-text-0)' }}>
                  {scripts.length}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--studio-text-2)' }}>
                  <GravityText gravityRadius={80} gravityStrength={0.25}>Scripts</GravityText>
                </p>
              </div>
              <div
                className="pl-8 md:pl-12"
                style={{ borderLeft: '1px solid var(--studio-border-apple)' }}
              >
                <p className="text-3xl font-semibold" style={{ color: 'var(--studio-text-0)' }}>
                  {totalRecorded}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--studio-text-2)' }}>
                  <GravityText gravityRadius={80} gravityStrength={0.25}>Recorded</GravityText>
                </p>
              </div>
              <div
                className="pl-8 md:pl-12"
                style={{ borderLeft: '1px solid var(--studio-border-apple)' }}
              >
                <p className="text-3xl font-semibold" style={{ color: 'var(--studio-text-0)' }}>
                  {totalLines}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--studio-text-2)' }}>
                  <GravityText gravityRadius={80} gravityStrength={0.25}>Total Lines</GravityText>
                </p>
              </div>
            </div>

            {/* Recording Progress */}
            {displayProgress.length > 0 && (
              <div className="mb-12">
                <p
                  className="text-xs font-medium tracking-widest uppercase mb-4"
                  style={{ color: 'var(--studio-text-2)' }}
                >
                  <GravityText gravityRadius={70} gravityStrength={0.28} textTransform="uppercase">
                    Recording Progress
                  </GravityText>
                </p>
                <div className="space-y-4">
                  {displayProgress.map((p) => (
                    <div key={p.script_id} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-body font-medium" style={{ color: 'var(--studio-text-0)' }}>
                          {p.script_name}
                        </p>
                        <p className="text-caption" style={{ color: 'var(--studio-text-2)' }}>
                          {p.recorded}/{p.total} lines
                        </p>
                      </div>
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden min-w-[80px]"
                          style={{ background: 'var(--studio-border)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${p.recorded > 0 ? Math.max(p.percent, 1) : p.percent}%`,
                              background: 'var(--studio-accent)',
                            }}
                          />
                        </div>
                        <span className="text-caption w-8 text-right" style={{ color: 'var(--studio-text-2)' }}>
                          {p.recorded > 0 && p.percent < 1
                            ? (p.recorded / p.total * 100).toFixed(1) + '%'
                            : `${p.percent}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="mb-12">
              <p
                className="text-xs font-medium tracking-widest uppercase mb-4"
                style={{ color: 'var(--studio-text-2)' }}
              >
                <GravityText gravityRadius={70} gravityStrength={0.28} textTransform="uppercase">
                  How It Works
                </GravityText>
              </p>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-body font-medium shrink-0" style={{ color: 'var(--studio-accent)' }}>1</span>
                  <p className="text-body" style={{ color: 'var(--studio-text-1)' }}>
                    <GravityText gravityRadius={85} gravityStrength={0.2}>
                      Select a script to record. Each script contains sentences for you to read aloud.
                    </GravityText>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-body font-medium shrink-0" style={{ color: 'var(--studio-accent)' }}>2</span>
                  <p className="text-body" style={{ color: 'var(--studio-text-1)' }}>
                    <GravityText gravityRadius={85} gravityStrength={0.2}>
                      Read each sentence clearly. Press Space or click the microphone button to record.
                    </GravityText>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-body font-medium shrink-0" style={{ color: 'var(--studio-accent)' }}>3</span>
                  <p className="text-body" style={{ color: 'var(--studio-text-1)' }}>
                    <GravityText gravityRadius={85} gravityStrength={0.2}>
                      Review and re-record if needed. Use arrow keys to navigate between lines.
                    </GravityText>
                  </p>
                </li>
              </ol>
            </div>

            {/* CTA */}
            <LiquidButton
              variant="primary"
              onClick={() => navigate('/record')}
              disabled={scripts.length === 0}
            >
              {scripts.length === 0 ? 'No scripts available' : 'Start Recording'}
              <LiquidMetalIcon size={18}>
                <ChevronRight size={18} />
              </LiquidMetalIcon>
            </LiquidButton>
            </motion.div>
          </PhysicsCard>
        </div>
      </div>
    </div>
  )
}
