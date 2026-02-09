import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'kuiper_accessibility_settings'

export type TextScale = 'small' | 'medium' | 'large' | 'extra-large'
export type IconScale = 'small' | 'medium' | 'large'

export interface AccessibilitySettings {
  textScale: TextScale
  iconScale: IconScale
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  speakOut: boolean
  voiceGuide: boolean
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  textScale: 'medium',
  iconScale: 'medium',
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  speakOut: true,
  voiceGuide: false,
}

export const TEXT_SCALE_MAP: Record<TextScale, number> = {
  small: 0.875,
  medium: 1,
  large: 1.25,
  'extra-large': 1.5,
}

export const ICON_SCALE_MAP: Record<IconScale, number> = {
  small: 16,
  medium: 24,
  large: 32,
}

export function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: AccessibilitySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function applySettingsToDOM(settings: AccessibilitySettings) {
  const root = document.documentElement
  root.style.setProperty('--accessibility-text-scale', String(TEXT_SCALE_MAP[settings.textScale]))
  root.style.setProperty('--accessibility-icon-scale', String(ICON_SCALE_MAP[settings.iconScale]))
  root.dataset.highContrast = settings.highContrast ? 'true' : 'false'
  root.dataset.largeText = settings.largeText ? 'true' : 'false'
  root.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
}

export function useAccessibilitySettings() {
  const [settings, setSettingsState] = useState<AccessibilitySettings>(loadSettings)

  useEffect(() => {
    applySettingsToDOM(settings)
  }, [settings])

  useEffect(() => {
    const stored = loadSettings()
    setSettingsState(stored)
  }, [])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as AccessibilitySettings
          setSettingsState((prev) => ({ ...prev, ...parsed }))
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates }
      saveSettings(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
  }, [])

  const activeCount = [
    settings.textScale !== 'medium',
    settings.iconScale !== 'medium',
    settings.highContrast,
    settings.largeText,
    settings.reducedMotion,
    settings.speakOut === false,
    settings.voiceGuide,
  ].filter(Boolean).length

  return { settings, setSettings, resetSettings, activeCount }
}
