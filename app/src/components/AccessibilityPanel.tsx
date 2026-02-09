import { useEffect, useRef, useState } from 'react'
import { X, Type, Image, Contrast, Move, Eye, Volume2 } from 'lucide-react'
import { useAccessibilitySettingsContext } from '../contexts/AccessibilitySettingsContext'
import type { TextScale, IconScale } from '../hooks/useAccessibilitySettings'
import { KeyboardShortcuts } from './KeyboardShortcuts'

interface AccessibilityPanelProps {
  isOpen: boolean
  onClose: () => void
}

const TEXT_SCALE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
]

const ICON_SCALE_OPTIONS: { value: IconScale; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, setSettings, resetSettings } = useAccessibilitySettingsContext()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable[0]?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-panel-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          className="relative studio-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              id="accessibility-panel-title"
              className="text-lg font-semibold"
              style={{ color: 'var(--studio-text-0)' }}
            >
              Accessibility Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--studio-glass-strong)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]"
              aria-label="Close"
            >
              <X size={20} style={{ color: 'var(--studio-text-1)' }} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Text size */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Type size={18} style={{ color: 'var(--studio-accent)' }} />
                <h3 className="text-sm font-medium" style={{ color: 'var(--studio-text-0)' }}>
                  Text Size
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEXT_SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSettings({ textScale: opt.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      settings.textScale === opt.value
                        ? 'bg-[var(--studio-accent)] text-[var(--studio-bg-0)]'
                        : 'bg-[var(--studio-glass)] border border-[var(--studio-border)] hover:bg-[var(--studio-glass-strong)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon size */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image size={18} style={{ color: 'var(--studio-accent)' }} />
                <h3 className="text-sm font-medium" style={{ color: 'var(--studio-text-0)' }}>
                  Icon Size
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {ICON_SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSettings({ iconScale: opt.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      settings.iconScale === opt.value
                        ? 'bg-[var(--studio-accent)] text-[var(--studio-bg-0)]'
                        : 'bg-[var(--studio-glass)] border border-[var(--studio-border)] hover:bg-[var(--studio-glass-strong)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="flex items-center gap-2" style={{ color: 'var(--studio-text-0)' }}>
                  <Contrast size={18} style={{ color: 'var(--studio-accent)' }} />
                  High contrast mode
                </span>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => setSettings({ highContrast: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="flex items-center gap-2" style={{ color: 'var(--studio-text-0)' }}>
                  <Eye size={18} style={{ color: 'var(--studio-accent)' }} />
                  Large text mode
                </span>
                <input
                  type="checkbox"
                  checked={settings.largeText}
                  onChange={(e) => setSettings({ largeText: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="flex items-center gap-2" style={{ color: 'var(--studio-text-0)' }}>
                  <Move size={18} style={{ color: 'var(--studio-accent)' }} />
                  Reduced motion
                </span>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => setSettings({ reducedMotion: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="flex items-center gap-2" style={{ color: 'var(--studio-text-0)' }}>
                  <Volume2 size={18} style={{ color: 'var(--studio-accent)' }} />
                  Speak out (pronunciation, T key)
                </span>
                <input
                  type="checkbox"
                  checked={settings.speakOut}
                  onChange={(e) => setSettings({ speakOut: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--studio-glass)',
                  border: '1px solid var(--studio-border)',
                  color: 'var(--studio-text-1)',
                }}
              >
                Keyboard shortcuts (?)
              </button>
              <button
                type="button"
                onClick={resetSettings}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--studio-glass)',
                  border: '1px solid var(--studio-border)',
                  color: 'var(--studio-text-2)',
                }}
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
