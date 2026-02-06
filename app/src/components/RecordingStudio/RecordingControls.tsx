import { SkipBack, SkipForward, RefreshCw } from 'lucide-react'
import { LiquidMetalIcon } from '../LiquidMetalIcon'
import { MicrophoneButton } from '../MicrophoneButton'

interface RecordingControlsProps {
  isRecording: boolean
  onRecord: () => void
  onPrev: () => void
  onNext: () => void
  onRedo: () => void
  canPrev: boolean
  canNext: boolean
  disabled: boolean
}

const btnClass =
  'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95'

export function RecordingControls({
  isRecording,
  onRecord,
  onPrev,
  onNext,
  onRedo,
  canPrev,
  canNext,
  disabled,
}: RecordingControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        type="button"
        onClick={onRedo}
        disabled={disabled}
        className={`${btnClass} text-[var(--studio-accent)]`}
        aria-label="Redo current phrase"
      >
        <LiquidMetalIcon size={22}>
          <RefreshCw size={22} strokeWidth={2} />
        </LiquidMetalIcon>
      </button>

      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev || disabled}
        className={`${btnClass} text-[var(--studio-text-0)]`}
        aria-label="Previous phrase"
      >
        <LiquidMetalIcon size={22}>
          <SkipBack size={22} strokeWidth={2} />
        </LiquidMetalIcon>
      </button>

      <MicrophoneButton
        isRecording={isRecording}
        onClick={onRecord}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || disabled}
        className={`${btnClass} text-[var(--studio-text-0)]`}
        aria-label="Next phrase"
      >
        <LiquidMetalIcon size={22}>
          <SkipForward size={22} strokeWidth={2} />
        </LiquidMetalIcon>
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={disabled}
        className={`${btnClass} text-[var(--studio-text-1)] md:hidden`}
        aria-label="Redo (alternate)"
      >
        <LiquidMetalIcon size={20}>
          <RefreshCw size={20} strokeWidth={2} />
        </LiquidMetalIcon>
      </button>
    </div>
  )
}
