/**
 * Audio controls panel - input gain, bass, treble, device selector.
 * Actually affects mic input via Web Audio API. Styled like Welcome card.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Plus, Minus, ChevronDown } from 'lucide-react'

export interface AudioProcessorSettings {
  gain: number
  bass: number
  treble: number
}

interface AudioInputDevice {
  deviceId: string
  label: string
}

interface AudioControlsPanelProps {
  className?: string
  gain: number
  bass: number
  treble: number
  deviceId: string | null
  onGainChange: (v: number) => void
  onBassChange: (v: number) => void
  onTrebleChange: (v: number) => void
  onDeviceChange: (id: string | null) => void
  audioLevel?: number
  isRecording?: boolean
}

function Fader({
  value,
  onChange,
  min,
  max,
  label,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  label: string
  unit?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const startY = clientY
      const startVal = value

      const move = (ev: MouseEvent | TouchEvent) => {
        const y = 'touches' in ev ? ev.touches[0].clientY : ev.clientY
        const delta = startY - y
        const sensitivity = (max - min) / 80
        const newVal = Math.round(Math.max(min, Math.min(max, startVal + delta * sensitivity)))
        onChange(newVal)
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        document.removeEventListener('touchmove', move)
        document.removeEventListener('touchend', up)
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
      document.addEventListener('touchmove', move, { passive: true })
      document.addEventListener('touchend', up)
    },
    [value, min, max, onChange]
  )

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-medium" style={{ color: 'var(--studio-text-2)' }}>
        {label}
      </p>
      <div
        ref={ref}
        className="w-3 h-24 rounded-full relative cursor-ns-resize select-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          border: '1px solid var(--studio-border)',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const p = 1 - (e.clientY - rect.top) / rect.height
          const v = min + p * (max - min)
          onChange(Math.round(v))
        }}
        onMouseDown={handleDrag}
        onTouchStart={handleDrag}
      >
        <div
          className="absolute left-0 right-0 rounded-full transition-all duration-75 pointer-events-none"
          style={{
            bottom: `${pct}%`,
            height: '6px',
            background: 'var(--studio-accent)',
            boxShadow: '0 0 6px var(--studio-accent-muted)',
          }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--studio-text-1)' }}>
        {value > 0 ? '+' : ''}{value}{unit ?? ''}
      </span>
    </div>
  )
}

function RotaryKnob({
  value,
  onChange,
  min,
  max,
  label,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  label: string
  unit?: string
}) {
  const angleRange = 270
  const angle = min === max ? 0 : ((value - min) / (max - min)) * angleRange

  const handleDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const startY = clientY
      const startVal = value

      const move = (ev: MouseEvent | TouchEvent) => {
        const y = 'touches' in ev ? ev.touches[0].clientY : ev.clientY
        const delta = startY - y
        const sensitivity = (max - min) / 80
        const newVal = Math.round(Math.max(min, Math.min(max, startVal + delta * sensitivity)))
        onChange(newVal)
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        document.removeEventListener('touchmove', move)
        document.removeEventListener('touchend', up)
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
      document.addEventListener('touchmove', move, { passive: true })
      document.addEventListener('touchend', up)
    },
    [value, min, max, onChange]
  )

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-16 h-16 rounded-full cursor-grab active:cursor-grabbing select-none"
        style={{
          background: 'linear-gradient(145deg, #252830 0%, #1a1c22 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onMouseDown={handleDrag}
        onTouchStart={handleDrag}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="knob-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--studio-accent)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--studio-accent)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--studio-accent)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#knob-glow)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(angle / angleRange) * 265} 265`}
          />
        </svg>
        <div
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--studio-accent)',
            boxShadow: '0 0 6px var(--studio-accent)',
            top: '20%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-22px)`,
          }}
        />
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--studio-text-2)' }}>
        {label}
      </p>
      <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--studio-text-0)' }}>
        {value}{unit ?? ''}
      </span>
    </div>
  )
}

export function AudioControlsPanel({
  className = '',
  gain,
  bass,
  treble,
  deviceId,
  onGainChange,
  onBassChange,
  onTrebleChange,
  onDeviceChange,
  audioLevel = 0,
  isRecording = false,
}: AudioControlsPanelProps) {
  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const [deviceOpen, setDeviceOpen] = useState(false)
  const deviceDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target as Node)) {
        setDeviceOpen(false)
      }
    }
    if (deviceOpen) {
      document.addEventListener('click', close)
      return () => document.removeEventListener('click', close)
    }
  }, [deviceOpen])

  useEffect(() => {
    const load = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
        const list = await navigator.mediaDevices.enumerateDevices()
        const inputs = list
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}` }))
        setDevices(inputs)
      } catch {
        setDevices([])
      }
    }
    load()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      className={`w-full max-w-lg mx-auto mt-8 ${className}`}
    >
      <div className="studio-card rounded-3xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--studio-glass-strong)',
              border: '1px solid var(--studio-border-apple)',
            }}
          >
            <Mic size={20} style={{ color: 'var(--studio-accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--studio-text-0)' }}>
              Microphone
            </h2>
            <p className="text-xs" style={{ color: 'var(--studio-text-2)' }}>
              Input gain, tone, and device
            </p>
          </div>
        </div>

        {/* Input level meter - when recording */}
        {isRecording && (
          <div className="mb-8">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: 'var(--studio-text-2)' }}>
              Input Level
            </p>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--studio-border)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--studio-accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, audioLevel * 150)}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        )}

        {/* Recording device */}
        <div className="mb-8" ref={deviceDropdownRef}>
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: 'var(--studio-text-2)' }}>
            Recording Device
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDeviceOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-left transition-colors"
              style={{
                background: 'var(--studio-glass)',
                border: '1px solid var(--studio-border-apple)',
                color: 'var(--studio-text-1)',
              }}
            >
              <span className="truncate">
                {devices.find((d) => d.deviceId === deviceId)?.label ?? 'Default microphone'}
              </span>
              <ChevronDown size={16} className="shrink-0" />
            </button>
            {deviceOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                style={{
                  background: 'var(--studio-glass-strong)',
                  border: '1px solid var(--studio-border-apple)',
                  boxShadow: 'var(--studio-shadow-outer)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onDeviceChange(null)
                    setDeviceOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--studio-glass)] transition-colors"
                  style={{ color: 'var(--studio-text-1)' }}
                >
                  Default
                </button>
                {devices.map((d) => (
                  <button
                    key={d.deviceId}
                    type="button"
                    onClick={() => {
                      onDeviceChange(d.deviceId)
                      setDeviceOpen(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--studio-glass)] transition-colors truncate"
                    style={{ color: 'var(--studio-text-1)' }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input gain */}
        <div className="mb-8">
          <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--studio-text-2)' }}>
            Input Gain
          </p>
          <div className="flex items-center gap-6">
            <RotaryKnob
              value={gain}
              onChange={onGainChange}
              min={20}
              max={200}
              label="Gain"
              unit="%"
            />
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onGainChange(Math.max(20, gain - 10))}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--studio-border)',
                  color: 'var(--studio-text-1)',
                }}
                aria-label="Decrease gain"
              >
                <Minus size={16} />
              </button>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--studio-border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${((gain - 20) / 180) * 100}%`,
                    background: 'var(--studio-accent)',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => onGainChange(Math.min(200, gain + 10))}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--studio-border)',
                  color: 'var(--studio-text-1)',
                }}
                aria-label="Increase gain"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tone - Bass & Treble */}
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--studio-text-2)' }}>
            Tone
          </p>
          <div className="flex justify-around gap-6">
            <Fader
              value={bass}
              onChange={onBassChange}
              min={-12}
              max={12}
              label="Bass"
              unit=" dB"
            />
            <Fader
              value={treble}
              onChange={onTrebleChange}
              min={-12}
              max={12}
              label="Treble"
              unit=" dB"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
