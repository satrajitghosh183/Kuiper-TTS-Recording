import { createContext, useContext, useState, type ReactNode } from 'react'

interface RecordingActiveContextValue {
  recordingActive: boolean
  setRecordingActive: (active: boolean) => void
}

const Context = createContext<RecordingActiveContextValue | null>(null)

export function RecordingActiveProvider({ children }: { children: ReactNode }) {
  const [recordingActive, setRecordingActive] = useState(false)

  return (
    <Context.Provider value={{ recordingActive, setRecordingActive }}>
      {children}
    </Context.Provider>
  )
}

export function useRecordingActive() {
  const ctx = useContext(Context)
  return ctx ?? { recordingActive: false, setRecordingActive: () => {} }
}
