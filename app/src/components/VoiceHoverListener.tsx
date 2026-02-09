import { useEffect, useRef } from 'react'
import { useVoiceGuide } from '../hooks/useVoiceGuide'
import { useAccessibilitySettingsContext } from '../contexts/AccessibilitySettingsContext'
import { useRecordingActive } from '../contexts/RecordingActiveContext'

/**
 * Listens for mouse hover on interactive elements and announces their labels
 * when voice guide is enabled. Uses aria-label, title, or data-voice-announce.
 */
export function VoiceHoverListener() {
  const { settings } = useAccessibilitySettingsContext()
  const { recordingActive } = useRecordingActive()
  const { speak, stop } = useVoiceGuide({
    enabled: settings.voiceGuide && !recordingActive,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.9,
  })
  const lastAnnouncedRef = useRef<{ el: Element; text: string } | null>(null)

  useEffect(() => {
    if (recordingActive) stop()
  }, [recordingActive, stop])

  useEffect(() => {
    if (!settings.voiceGuide || recordingActive) return

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      const el = target.closest(
        'button, [role="button"], a[href], [role="link"], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null
      if (!el) return

      const text =
        el.getAttribute('data-voice-announce') ||
        el.getAttribute('aria-label') ||
        (el as HTMLButtonElement).title ||
        el.getAttribute('title') ||
        (el.tagName === 'A' && el.textContent?.trim()) ||
        (el.tagName === 'INPUT' && (el as HTMLInputElement).placeholder) ||
        null

      if (!text || text.trim() === '') return

      // Avoid repeating the same announcement when hovering in place
      if (lastAnnouncedRef.current?.el === el && lastAnnouncedRef.current?.text === text) {
        return
      }
      lastAnnouncedRef.current = { el, text }

      // Interrupt current speech to announce the new hover target
      speak(text, true)
    }

    const handleMouseOut = () => {
      // Reset when leaving an element so re-entering will announce again
      lastAnnouncedRef.current = null
    }

    document.addEventListener('mouseover', handleMouseOver, { capture: true })
    document.addEventListener('mouseout', handleMouseOut, { capture: true })
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true })
      document.removeEventListener('mouseout', handleMouseOut, { capture: true })
    }
  }, [settings.voiceGuide, recordingActive, speak])

  return null
}
