import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AccessibilitySettings } from '../hooks/useAccessibilitySettings'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  TEXT_SCALE_MAP,
  ICON_SCALE_MAP,
} from '../hooks/useAccessibilitySettings'

interface AccessibilitySettingsContextValue {
  settings: AccessibilitySettings
  setSettings: (updates: Partial<AccessibilitySettings>) => void
  resetSettings: () => void
  activeCount: number
}

const Context = createContext<AccessibilitySettingsContextValue | null>(null)

function applySettingsToDOM(settings: AccessibilitySettings) {
  const root = document.documentElement
  root.style.setProperty('--accessibility-text-scale', String(TEXT_SCALE_MAP[settings.textScale]))
  root.style.setProperty('--accessibility-icon-scale', String(ICON_SCALE_MAP[settings.iconScale]))
  root.dataset.highContrast = settings.highContrast ? 'true' : 'false'
  root.dataset.largeText = settings.largeText ? 'true' : 'false'
  root.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
}

export function AccessibilitySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AccessibilitySettings>(loadSettings)

  useEffect(() => {
    applySettingsToDOM(settings)
  }, [settings])

  useEffect(() => {
    setSettingsState(loadSettings())
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

  return (
    <Context.Provider value={{ settings, setSettings, resetSettings, activeCount }}>
      {children}
    </Context.Provider>
  )
}

export function useAccessibilitySettingsContext() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAccessibilitySettingsContext must be used within AccessibilitySettingsProvider')
  return ctx
}
