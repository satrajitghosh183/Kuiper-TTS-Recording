interface RecorderNameInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RecorderNameInput({
  value,
  onChange,
  placeholder = 'Recorder name',
}: RecorderNameInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-[180px] px-3 py-2 rounded-xl border text-[var(--studio-text-0)] placeholder:text-[var(--studio-text-2)] text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--studio-accent)] focus:ring-offset-2 focus:ring-offset-transparent transition-all"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderColor: 'var(--studio-border-apple)',
      }}
      aria-label="Recorder name"
    />
  )
}
