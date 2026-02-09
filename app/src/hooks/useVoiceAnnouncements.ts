import { useCallback } from 'react'
import { useVoiceGuide } from './useVoiceGuide'
import { useAccessibilitySettingsContext } from '../contexts/AccessibilitySettingsContext'

/**
 * Hook for making contextual voice announcements.
 * Use this to announce user actions, button clicks, etc.
 */
export function useVoiceAnnouncements() {
  const { settings } = useAccessibilitySettingsContext()
  const { speak } = useVoiceGuide({
    enabled: settings.voiceGuide,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.9,
  })

  const announce = useCallback(
    (message: string, interrupt = false) => {
      if (settings.voiceGuide) {
        speak(message, interrupt)
      }
    },
    [settings.voiceGuide, speak]
  )

  return { announce }
}
