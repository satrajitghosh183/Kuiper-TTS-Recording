import { motion, useReducedMotion } from 'framer-motion'
import { PhraseDisplay } from './PhraseDisplay'
import { StatusCheck } from './StatusCheck'
import { RecordingCD } from './RecordingCD'
import { ProgressBump } from './ProgressBump'
import { RecordingControls } from './RecordingControls'

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
  canPrev,
  canNext,
  disabled,
}: RecordingStudioCardProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      className="relative z-10 w-full max-w-[560px] md:max-w-[640px] mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={!prefersReducedMotion ? { rotateX: 1, rotateY: -1, y: -2 } : undefined}
      style={{ transformPerspective: 800 }}
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
            size={80}
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
          onRecord={onRecord}
          onPrev={onPrev}
          onNext={onNext}
          onRedo={onRedo}
          canPrev={canPrev}
          canNext={canNext}
          disabled={disabled}
        />
      </div>
    </motion.div>
  )
}
