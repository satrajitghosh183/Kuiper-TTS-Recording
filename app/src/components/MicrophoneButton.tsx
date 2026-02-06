/**
 * Microphone recording button - ripple waves, glow, smooth loop animation, shining shadow.
 * Inspired by Framer Microphone component.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'

interface MicrophoneButtonProps {
  isRecording: boolean
  onClick: () => void
  disabled?: boolean
}

export function MicrophoneButton({ isRecording, onClick, disabled }: MicrophoneButtonProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: isRecording ? 'var(--studio-accent-recording)' : 'var(--studio-text-0)',
        color: isRecording ? 'white' : 'var(--studio-bg-0)',
        boxShadow: isRecording
          ? '0 0 24px rgba(255, 69, 58, 0.5), 0 0 48px rgba(255, 69, 58, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={
        isRecording && !prefersReducedMotion
          ? {
              boxShadow: [
                '0 0 24px rgba(255, 69, 58, 0.5), 0 0 48px rgba(255, 69, 58, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                '0 0 32px rgba(255, 69, 58, 0.6), 0 0 64px rgba(255, 69, 58, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                '0 0 24px rgba(255, 69, 58, 0.5), 0 0 48px rgba(255, 69, 58, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              ],
            }
          : {}
      }
      transition={{ duration: 1.5, repeat: isRecording ? Infinity : 0, repeatType: 'reverse' }}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {/* Ripple rings when recording - smooth loop like Framer */}
      {isRecording && !prefersReducedMotion && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[var(--studio-accent-recording)]"
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[var(--studio-accent-recording)]"
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[var(--studio-accent-recording)]"
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
          />
        </>
      )}
      {/* Shine highlight */}
      {!isRecording && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
          }}
        />
      )}
      {isRecording ? (
        <Square size={26} strokeWidth={2.5} className="fill-current relative z-10" />
      ) : (
        <Mic size={28} strokeWidth={2} className="relative z-10" />
      )}
    </motion.button>
  )
}
