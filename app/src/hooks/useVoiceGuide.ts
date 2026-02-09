import { useCallback, useRef, useEffect } from 'react'

interface VoiceGuideOptions {
  enabled: boolean
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

const DEFAULT_OPTIONS: Required<Omit<VoiceGuideOptions, 'enabled'>> = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  lang: 'en-US',
}

export function useVoiceGuide(options: VoiceGuideOptions) {
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  const speak = useCallback(
    (text: string, interrupt = false) => {
      if (!options.enabled || !synthRef.current) return

      // Cancel any ongoing speech if interrupting
      if (interrupt && synthRef.current.speaking) {
        synthRef.current.cancel()
      }

      // Wait for any cancellation to complete
      if (synthRef.current.speaking && !interrupt) {
        // Queue the message
        setTimeout(() => speak(text, false), 100)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate ?? DEFAULT_OPTIONS.rate
      utterance.pitch = options.pitch ?? DEFAULT_OPTIONS.pitch
      utterance.volume = options.volume ?? DEFAULT_OPTIONS.volume
      utterance.lang = options.lang ?? DEFAULT_OPTIONS.lang

      // Use a natural-sounding voice if available
      const voices = synthRef.current.getVoices()
      const preferredVoice =
        voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find((v) => v.lang.startsWith('en') && v.localService === false) ||
        voices.find((v) => v.lang.startsWith('en'))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utteranceRef.current = utterance
      synthRef.current.speak(utterance)
    },
    [options.enabled, options.rate, options.pitch, options.volume, options.lang]
  )

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }, [])

  const isSpeaking = useCallback(() => {
    return synthRef.current?.speaking ?? false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  return { speak, stop, isSpeaking }
}
