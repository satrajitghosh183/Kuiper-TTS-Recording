import { useEffect } from 'react'

const STORAGE_KEY = 'kuiper_accessibility_settings'

const TEXT_SCALE_MAP: Record<string, number> = {
  small: 0.875,
  medium: 1,
  large: 1.25,
  'extra-large': 1.5,
}

const ICON_SCALE_MAP: Record<string, number> = {
  small: 16,
  medium: 24,
  large: 32,
}

/** Applies accessibility settings from localStorage on initial load (before Layout). */
export function AccessibilityInit() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const s = JSON.parse(raw) as Record<string, unknown>
        const root = document.documentElement
        root.style.setProperty('--accessibility-text-scale', String(TEXT_SCALE_MAP[String(s.textScale)] ?? 1))
        root.style.setProperty('--accessibility-icon-scale', String(ICON_SCALE_MAP[String(s.iconScale)] ?? 24))
        root.dataset.highContrast = s.highContrast ? 'true' : 'false'
        root.dataset.largeText = s.largeText ? 'true' : 'false'
        root.dataset.reducedMotion = s.reducedMotion ? 'true' : 'false'
      }
    } catch {
      // ignore
    }
  }, [])
  return null
}
