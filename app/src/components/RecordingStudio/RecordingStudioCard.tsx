import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PhraseDisplay } from './PhraseDisplay'
import { StatusCheck } from './StatusCheck'
import { RecordingCD } from './RecordingCD'
import { ProgressBump } from './ProgressBump'
import { RecordingControls } from './RecordingControls'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface RecordingStudioCardProps {
  phraseText: string
  scriptName: string
  lineIndex: number
  totalLines: number
  hasRecording: boolean
  isRecording: boolean
  audioLevel: number
  elapsedSeconds: number
  remainingSeconds: number
  remainingLines: number
  onSeek: (index: number) => void
  onRecord: () => void
  onPrev: () => void
  onNext: () => void
  onRedo: () => void
  onSave?: () => void
  onPlay?: () => void
  onPronounce?: () => void
  onShowShortcuts?: () => void
  hasUnsavedBlob?: boolean
  saveState?: SaveState
  canPrev: boolean
  canNext: boolean
  disabled: boolean
}

export function RecordingStudioCard({
  phraseText,
  scriptName,
  lineIndex,
  totalLines,
  hasRecording,
  isRecording,
  audioLevel: _audioLevel,
  elapsedSeconds,
  remainingSeconds,
  remainingLines,
  onSeek,
  onRecord,
  onPrev,
  onNext,
  onRedo,
  onSave,
  onPlay,
  onPronounce,
  onShowShortcuts,
  hasUnsavedBlob = false,
  saveState = 'idle',
  canPrev,
  canNext,
  disabled,
}: RecordingStudioCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const [cdSize, setCdSize] = useState(80)
  useEffect(() => {
    const update = () => setCdSize(Math.min(80, Math.max(48, window.innerWidth * 0.12)))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return (
    <motion.div
      className="relative z-10 w-full mx-auto"
      style={{ maxWidth: 'min(100vw - 2rem, 640px)', transformPerspective: 800 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={!prefersReducedMotion ? { rotateX: 1, rotateY: -1, y: -2 } : undefined}
    >
      <div className="studio-card">
        <StatusCheck recorded={hasRecording} />
        {/* Phrase display */}
        <PhraseDisplay
          text={phraseText}
          scriptName={scriptName}
          lineIndex={lineIndex}
          totalLines={totalLines}
        />

        {/* CD / Vinyl player - like Framer CD: click to drop needle & record, click again to stop */}
        <div className="mb-5 flex flex-col items-center justify-center">
          <RecordingCD
            isRecording={isRecording}
            onRecord={onRecord}
            disabled={disabled}
            size={cdSize}
          />
        </div>

        {/* Progress bump */}
        <ProgressBump
          current={lineIndex}
          total={totalLines}
          onSeek={onSeek}
          elapsedSeconds={elapsedSeconds}
          remainingSeconds={remainingSeconds}
          remainingLines={remainingLines}
        />

        {/* Transport controls */}
        <RecordingControls
          isRecording={isRecording}
          hasUnsavedBlob={hasUnsavedBlob}
          saveState={saveState}
          onRecord={onRecord}
          onPrev={onPrev}
          onNext={onNext}
          onRedo={onRedo}
          onSave={onSave}
          onPlay={onPlay}
          onPronounce={onPronounce}
          onShowShortcuts={onShowShortcuts}
          canPrev={canPrev}
          canNext={canNext}
          disabled={disabled}
        />
      </div>
    </motion.div>
  )
}
