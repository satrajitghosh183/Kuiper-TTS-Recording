import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

interface ScreenReaderContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const ScreenReaderContext = createContext<ScreenReaderContextValue | null>(null)

export function ScreenReaderProvider({ children }: { children: ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = priority === 'assertive' ? assertiveRef.current : politeRef.current
    if (el) {
      el.textContent = ''
      requestAnimationFrame(() => {
        el.textContent = message
      })
    }
  }, [])

  return (
    <ScreenReaderContext.Provider value={{ announce }}>
      {children}
      <div
        ref={politeRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      <div
        ref={assertiveRef}
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      />
    </ScreenReaderContext.Provider>
  )
}

export function useScreenReader() {
  const ctx = useContext(ScreenReaderContext)
  return ctx ?? { announce: () => {} }
}
