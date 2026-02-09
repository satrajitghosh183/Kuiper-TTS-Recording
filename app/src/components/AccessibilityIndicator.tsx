import { Accessibility } from 'lucide-react'

interface AccessibilityIndicatorProps {
  activeCount: number
  onClick: () => void
}

export function AccessibilityIndicator({ activeCount, onClick }: AccessibilityIndicatorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 p-3 rounded-xl transition-all min-w-[44px] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]"
      style={{
        background: 'var(--studio-glass-apple)',
        border: '1px solid var(--studio-border-apple)',
        color: activeCount > 0 ? 'var(--studio-accent)' : 'var(--studio-text-1)',
      }}
      aria-label={`Accessibility settings${activeCount > 0 ? `, ${activeCount} features active` : ''}`}
      title={activeCount > 0 ? `${activeCount} accessibility features active` : 'Accessibility settings'}
    >
      <Accessibility size={22} />
      {activeCount > 0 && (
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{
            background: 'var(--studio-accent)',
            color: 'var(--studio-bg-0)',
          }}
        >
          {activeCount}
        </span>
      )}
    </button>
  )
}
