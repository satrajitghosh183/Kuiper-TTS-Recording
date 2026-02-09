import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useVoiceGuide } from './useVoiceGuide'
import { useAccessibilitySettingsContext } from '../contexts/AccessibilitySettingsContext'
import { useRecordingActive } from '../contexts/RecordingActiveContext'

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Welcome page. Here you can see your recording progress and get started.',
  '/record': 'Recording Studio. Record voice samples for training. Use Space to start recording, S to save, and arrow keys to navigate phrases.',
  '/library': 'Library. Browse and listen to your recorded voice samples.',
  '/admin': 'Admin Panel. Manage scripts and recordings.',
  '/login': 'Login page. Sign in to your account.',
  '/signup': 'Sign up page. Create a new account.',
}

const PAGE_ACTIONS: Record<string, string> = {
  '/': 'You can navigate to Record, Library, or Admin using the sidebar.',
  '/record': 'Press Space to start recording. Press S to save. Press T to hear pronunciation. Press ? for keyboard shortcuts.',
  '/library': 'Browse your recordings by script. Click play to listen to any recording.',
  '/admin': 'Upload new scripts or manage existing ones.',
  '/login': 'Enter your email and password to sign in.',
  '/signup': 'Enter your email and password to create an account.',
}

export function usePageAnnouncements() {
  const location = useLocation()
  const { settings } = useAccessibilitySettingsContext()
  const { recordingActive } = useRecordingActive()
  const { speak, stop } = useVoiceGuide({
    enabled: settings.voiceGuide && !recordingActive,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.9,
  })

  // Stop any ongoing speech when recording starts
  useEffect(() => {
    if (recordingActive) stop()
  }, [recordingActive, stop])

  useEffect(() => {
    if (!settings.voiceGuide || recordingActive) return

    const path = location.pathname
    const description = PAGE_DESCRIPTIONS[path] || `You are on ${path}`
    const actions = PAGE_ACTIONS[path] || ''

    // Announce page change after a short delay to avoid interrupting navigation
    const timer = setTimeout(() => {
      const message = actions ? `${description}. ${actions}` : description
      speak(message, true)
    }, 500)

    return () => clearTimeout(timer)
  }, [location.pathname, settings.voiceGuide, recordingActive, speak])

  // Welcome message when voice guide is first enabled
  useEffect(() => {
    if (!settings.voiceGuide || recordingActive) return

    const wasEnabled = sessionStorage.getItem('voiceGuideEnabled')
    if (!wasEnabled) {
      sessionStorage.setItem('voiceGuideEnabled', 'true')
      setTimeout(() => {
        speak('Voice guide enabled. You will hear navigation help and contextual information as you use the website.', true)
      }, 1000)
    }
  }, [settings.voiceGuide, recordingActive, speak])
}
