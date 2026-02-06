import { Check } from 'lucide-react'

interface StatusCheckProps {
  recorded: boolean
}

export function StatusCheck({ recorded }: StatusCheckProps) {
  if (!recorded) return null

  return (
    <div
      className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
      style={{
        background: 'var(--studio-accent)',
        boxShadow: '0 2px 8px var(--studio-accent-muted)',
      }}
      aria-label="Phrase recorded"
    >
      <Check size={22} strokeWidth={2.5} className="text-white" />
    </div>
  )
}
