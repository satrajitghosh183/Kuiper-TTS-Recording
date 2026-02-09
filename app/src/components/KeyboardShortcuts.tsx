import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: ['Space'], action: 'Start / Stop recording' },
  { keys: ['S'], action: 'Save current recording' },
  { keys: ['R'], action: 'Redo / restart recording' },
  { keys: ['P'], action: 'Play current recording' },
  { keys: ['T'], action: 'Hear pronunciation' },
  { keys: ['Esc'], action: 'Cancel recording' },
  { keys: ['←'], action: 'Previous phrase' },
  { keys: ['→'], action: 'Next phrase (auto-skips recorded)' },
  { keys: ['?'], action: 'Show this overlay' },
]

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

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
    if (isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      first?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        className="relative studio-card max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id="keyboard-shortcuts-title"
            className="text-lg font-semibold"
            style={{ color: 'var(--studio-text-0)' }}
          >
            Keyboard Shortcuts
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
        <div className="space-y-3">
          {shortcuts.map(({ keys, action }) => (
            <div
              key={action}
              className="flex items-center justify-between gap-4 py-2 border-b border-[var(--studio-border)] last:border-0"
            >
              <span style={{ color: 'var(--studio-text-1)' }}>{action}</span>
              <div className="flex gap-2">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 rounded text-sm font-mono"
                    style={{
                      background: 'var(--studio-glass-strong)',
                      border: '1px solid var(--studio-border)',
                      color: 'var(--studio-text-0)',
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-sm" style={{ color: 'var(--studio-text-2)' }}>
          Press Escape or click outside to close.
        </div>
      </div>
    </div>
  )
}
