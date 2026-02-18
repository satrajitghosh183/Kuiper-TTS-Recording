import { SkipBack, SkipForward, RefreshCw, Play, Save, Volume2, Loader2, Check } from 'lucide-react'
import { LiquidMetalIcon } from '../LiquidMetalIcon'
import { MicrophoneButton } from '../MicrophoneButton'
import { Tooltip } from '../Tooltip'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface RecordingControlsProps {
  isRecording: boolean
  hasUnsavedBlob: boolean
  saveState?: SaveState
  onRecord: () => void
  onPrev: () => void
  onNext: () => void
  onRedo: () => void
  onSave?: () => void
  onPlay?: () => void
  onPronounce?: () => void
  onShowShortcuts?: () => void
  canPrev: boolean
  canNext: boolean
  disabled: boolean
}

const btnClass =
  'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px]'

export function RecordingControls({
  isRecording,
  hasUnsavedBlob,
  saveState = 'idle',
  onRecord,
  onPrev,
  onNext,
  onRedo,
  onSave,
  onPlay,
  onPronounce,
  onShowShortcuts,
  canPrev,
  canNext,
  disabled,
}: RecordingControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
      {/* Save state indicator */}
      {saveState === 'saving' && (
        <div
          className={`${btnClass} text-[var(--studio-accent)]`}
          aria-label="Saving recording..."
        >
          <Loader2 size={22} strokeWidth={2} className="animate-spin" />
        </div>
      )}
      {saveState === 'saved' && (
        <div
          className={`${btnClass} text-green-500`}
          aria-label="Recording saved"
        >
          <Check size={22} strokeWidth={2} />
        </div>
      )}
      {/* Save now button - shows when there's an unsaved blob, allows immediate save */}
      {hasUnsavedBlob && onSave && saveState === 'idle' && (
        <Tooltip content="Auto-saves in 2s. Click to save now.">
          <button
            type="button"
            onClick={onSave}
            disabled={disabled}
            className={`${btnClass} text-[var(--studio-accent)] animate-pulse`}
            aria-label="Save recording now (S) - auto-saves in 2 seconds"
          >
            <LiquidMetalIcon size={22}>
              <Save size={22} strokeWidth={2} />
            </LiquidMetalIcon>
          </button>
        </Tooltip>
      )}
      {onPlay && (
        <button
          type="button"
          onClick={onPlay}
          disabled={disabled}
          className={`${btnClass} text-[var(--studio-text-0)]`}
          aria-label="Play recording (P)"
        >
          <LiquidMetalIcon size={22}>
            <Play size={22} strokeWidth={2} />
          </LiquidMetalIcon>
        </button>
      )}
      {onPronounce && (
        <button
          type="button"
          onClick={onPronounce}
          disabled={disabled}
          className={`${btnClass} text-[var(--studio-text-0)]`}
          aria-label="Hear pronunciation (T)"
        >
          <LiquidMetalIcon size={22}>
            <Volume2 size={22} strokeWidth={2} />
          </LiquidMetalIcon>
        </button>
      )}
      <button
        type="button"
        onClick={onRedo}
        disabled={disabled}
        className={`${btnClass} text-[var(--studio-accent)]`}
        aria-label="Redo current phrase (R)"
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

      {onShowShortcuts && (
        <Tooltip content="Click here for help">
          <button
            type="button"
            onClick={onShowShortcuts}
            className={`${btnClass} text-[var(--studio-text-2)]`}
            aria-label="Show keyboard shortcuts (?)"
          >
            <span className="text-lg font-semibold">?</span>
          </button>
        </Tooltip>
      )}

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
