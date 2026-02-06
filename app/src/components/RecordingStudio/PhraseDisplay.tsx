import { motion, AnimatePresence } from 'framer-motion'

interface PhraseDisplayProps {
  text: string
  scriptName: string
  lineIndex: number
  totalLines: number
}

export function PhraseDisplay({ text, scriptName, lineIndex, totalLines }: PhraseDisplayProps) {
  return (
    <div className="mb-5">
      <AnimatePresence mode="wait">
        <motion.p
          key={`${scriptName}-${lineIndex}`}
          className="text-[24px] md:text-[28px] font-semibold leading-relaxed text-[var(--studio-text-0)]"
          style={{ letterSpacing: '-0.01em' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {text || '—'}
        </motion.p>
      </AnimatePresence>
      <p
        className="mt-1 text-[15px] text-[var(--studio-text-2)]"
        aria-label={`Script: ${scriptName}, Line ${lineIndex + 1} of ${totalLines}`}
      >
        {scriptName}
      </p>
    </div>
  )
}
