import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, LayoutGrid } from 'lucide-react'
import { LiquidMetalIcon } from '../components/LiquidMetalIcon'
import { RecordingStudioCard, BackgroundScene, AudioControlsPanel } from '../components/RecordingStudio'
import { api, type Recording as RecordingType, type Script } from '../lib/api'
import { useAudioRecorder } from '../hooks/useAudioRecorder'

interface RecordingEntry {
  id?: number
  text: string
  duration_seconds: number
  is_valid: boolean
}

export function Record() {
  const navigate = useNavigate()

  const [scripts, setScripts] = useState<Script[]>([])
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [recordings, setRecordings] = useState<Map<string, RecordingEntry>>(new Map())
  const [isLoadingScripts, setIsLoadingScripts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [showAudioControls, setShowAudioControls] = useState(false)
  const [audioGain, setAudioGain] = useState(() => {
    const v = localStorage.getItem('kuiper_audio_gain')
    return v ? Math.max(20, Math.min(200, parseInt(v, 10))) : 100
  })
  const [audioBass, setAudioBass] = useState(() => {
    const v = localStorage.getItem('kuiper_audio_bass')
    return v ? Math.max(-12, Math.min(12, parseInt(v, 10))) : 0
  })
  const [audioTreble, setAudioTreble] = useState(() => {
    const v = localStorage.getItem('kuiper_audio_treble')
    return v ? Math.max(-12, Math.min(12, parseInt(v, 10))) : 0
  })
  const [audioDeviceId, setAudioDeviceId] = useState<string | null>(() =>
    localStorage.getItem('kuiper_audio_device') || null
  )

  const saveSettingsTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    localStorage.setItem('kuiper_audio_gain', String(audioGain))
  }, [audioGain])
  useEffect(() => {
    localStorage.setItem('kuiper_audio_bass', String(audioBass))
  }, [audioBass])
  useEffect(() => {
    localStorage.setItem('kuiper_audio_treble', String(audioTreble))
  }, [audioTreble])
  useEffect(() => {
    if (audioDeviceId) localStorage.setItem('kuiper_audio_device', audioDeviceId)
    else localStorage.removeItem('kuiper_audio_device')
  }, [audioDeviceId])

  // Load per-user audio settings from backend (overrides local defaults)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getUserSettings()
        setAudioGain(Math.max(20, Math.min(200, settings.gain)))
        setAudioBass(Math.max(-12, Math.min(12, settings.bass)))
        setAudioTreble(Math.max(-12, Math.min(12, settings.treble)))
        setAudioDeviceId(settings.device_id)
      } catch (err) {
        console.warn('Failed to load user settings, using local defaults', err)
      }
    }
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist settings to backend (debounced) so they follow the user across devices
  useEffect(() => {
    if (saveSettingsTimeoutRef.current) {
      window.clearTimeout(saveSettingsTimeoutRef.current)
    }
    saveSettingsTimeoutRef.current = window.setTimeout(() => {
      api.updateUserSettings({
        gain: audioGain,
        bass: audioBass,
        treble: audioTreble,
        device_id: audioDeviceId,
      }).catch((err) => {
        console.warn('Failed to save user settings', err)
      })
    }, 600)
    return () => {
      if (saveSettingsTimeoutRef.current) {
        window.clearTimeout(saveSettingsTimeoutRef.current)
      }
    }
  }, [audioGain, audioBass, audioTreble, audioDeviceId])

  useEffect(() => {
    const loadScripts = async () => {
      try {
        setIsLoadingScripts(true)
        setError(null)
        const loadedScripts = await api.listScripts()
        if (loadedScripts.length === 0) {
          setError('No text scripts found. An admin needs to add scripts first.')
        } else {
          setScripts(loadedScripts)
        }
      } catch (err) {
        console.error('Failed to load scripts:', err)
        setError('Failed to load scripts. Make sure the backend is running.')
      } finally {
        setIsLoadingScripts(false)
      }
    }
    loadScripts()
  }, [])

  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const existing = await api.listRecordings()
        const recordingsMap = new Map<string, RecordingEntry>()
        existing.forEach((rec: RecordingType) => {
          const key = `${rec.script_id}_${rec.line_index}`
          recordingsMap.set(key, {
            id: rec.id,
            text: rec.text || rec.phrase_text,
            duration_seconds: rec.duration_seconds,
            is_valid: rec.is_valid,
          })
        })
        setRecordings(recordingsMap)
      } catch (err) {
        console.error('Failed to load recordings:', err)
      }
    }
    loadRecordings()
  }, [])

  const currentScript = scripts[currentScriptIndex]
  const currentLine = currentScript?.lines[currentLineIndex] || ''
  const recordingKey = currentScript ? `${currentScript.id}_${currentLineIndex}` : ''
  const hasRecording = recordings.has(recordingKey)
  const totalLines = currentScript?.lines.length ?? 0
  const remainingLines = totalLines > 0 ? totalLines - currentLineIndex - 1 : 0

  const {
    isRecording,
    audioLevel,
    duration,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder({
    processorSettings: { gain: audioGain, bass: audioBass, treble: audioTreble },
    onDataAvailable: async (blob) => {
      if (!currentScript) return
      try {
        setSaveError(null)
        const result = await api.saveRecording(
          blob,
          currentScript.id,
          currentLineIndex,
          currentLine
        )
        if (result.success) {
          setRecordings(prev =>
            new Map(prev).set(recordingKey, {
              id: result.id,
              text: currentLine,
              duration_seconds: result.duration_seconds,
              is_valid: result.is_valid,
            })
          )
        } else {
          setSaveError(result.error || 'Failed to save recording')
        }
      } catch (err) {
        console.error('Failed to save recording:', err)
        setSaveError(err instanceof Error ? err.message : 'Failed to save recording')
      }
    },
  })

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      stopRecording()
    } else {
      clearRecording()
      setSaveError(null)
      await startRecording(audioDeviceId ?? undefined)
    }
  }, [isRecording, stopRecording, clearRecording, startRecording, audioDeviceId])

  const handleNext = useCallback(() => {
    if (!currentScript) return
    if (currentLineIndex < currentScript.lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1)
    } else if (currentScriptIndex < scripts.length - 1) {
      setCurrentScriptIndex(prev => prev + 1)
      setCurrentLineIndex(0)
    }
    clearRecording()
    setSaveError(null)
  }, [currentScript, currentLineIndex, currentScriptIndex, scripts.length, clearRecording])

  const handlePrev = useCallback(() => {
    if (!currentScript) return
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1)
    } else if (currentScriptIndex > 0) {
      setCurrentScriptIndex(prev => prev - 1)
      setCurrentLineIndex(Math.max(0, (scripts[currentScriptIndex - 1]?.lines.length ?? 1) - 1))
    }
    clearRecording()
    setSaveError(null)
  }, [currentScript, currentLineIndex, currentScriptIndex, scripts, clearRecording])

  const handleRedo = useCallback(() => {
    setRecordings(prev => {
      const next = new Map(prev)
      next.delete(recordingKey)
      return next
    })
    clearRecording()
    setSaveError(null)
  }, [recordingKey, clearRecording])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handleRecord()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRecord, handleNext, handlePrev])

  const handleSeek = useCallback(
    (index: number) => {
      if (!currentScript) return
      const clamped = Math.max(0, Math.min(index, currentScript.lines.length - 1))
      setCurrentLineIndex(clamped)
      clearRecording()
      setSaveError(null)
    },
    [currentScript, clearRecording]
  )

  const elapsedSeconds = isRecording ? duration : recordings.get(recordingKey)?.duration_seconds ?? 0
  const remainingSeconds = 0

  const canPrev = currentLineIndex > 0 || currentScriptIndex > 0
  const canNext =
    !!currentScript &&
    (currentLineIndex < currentScript.lines.length - 1 || currentScriptIndex < scripts.length - 1)
  const disabled = !currentScript

  if (isLoadingScripts) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[var(--studio-accent)] mb-4" />
        <p className="text-[var(--studio-text-1)]">Loading scripts...</p>
      </div>
    )
  }

  if (error && scripts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'var(--studio-glass)',
            border: '1px solid var(--studio-border)',
            backdropFilter: 'blur(22px)',
          }}
        >
          <AlertCircle size={48} className="text-[var(--studio-accent-recording)] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--studio-text-0)] mb-2">No Scripts Found</h2>
          <p className="text-[var(--studio-text-1)] mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl text-[var(--studio-text-1)] hover:bg-[var(--studio-glass-strong)] transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[var(--studio-accent)] text-white hover:brightness-110 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen -mx-xl -my-lg">
      {/* Audio controls toggle - top right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setShowAudioControls(p => !p)}
          className={`p-2 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] ${
            showAudioControls
              ? 'bg-[var(--studio-glass-strong)] border-[var(--studio-accent)] text-[var(--studio-accent)]'
              : 'bg-[var(--studio-glass)] border-[var(--studio-border)] text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] hover:bg-[var(--studio-glass-strong)]'
          }`}
          aria-label={showAudioControls ? 'Hide audio controls' : 'Show audio controls'}
          title="Audio controls"
        >
          <LiquidMetalIcon size={20}>
            <LayoutGrid size={20} />
          </LiquidMetalIcon>
        </button>
      </div>

      <BackgroundScene mode="studio">
        <RecordingStudioCard
          phraseText={currentLine}
          scriptName={currentScript?.name ?? 'No script'}
          lineIndex={currentLineIndex}
          totalLines={totalLines}
          hasRecording={hasRecording}
          isRecording={isRecording}
          audioLevel={audioLevel}
          elapsedSeconds={elapsedSeconds}
          remainingSeconds={remainingSeconds}
          remainingLines={remainingLines}
          onSeek={handleSeek}
          onRecord={handleRecord}
          onPrev={handlePrev}
          onNext={handleNext}
          onRedo={handleRedo}
          canPrev={canPrev}
          canNext={canNext}
          disabled={disabled}
        />

        {saveError && (
          <div
            className="mt-4 px-4 py-3 rounded-xl max-w-[560px] w-full mx-auto flex items-center gap-3"
            style={{
              background: 'rgba(255, 69, 58, 0.15)',
              border: '1px solid rgba(255, 69, 58, 0.3)',
            }}
          >
            <AlertCircle size={20} className="text-[var(--studio-accent-recording)] shrink-0" />
            <p className="text-sm text-[var(--studio-accent-recording)]">{saveError}</p>
          </div>
        )}

        {scripts.length > 1 && (
          <div className="flex gap-2 flex-wrap justify-center mt-6 max-w-[560px] mx-auto">
            {scripts.map((script, idx) => {
              const scriptRecordings = Array.from(recordings.keys()).filter(k =>
                k.startsWith(script.id + '_')
              ).length
              const isComplete = scriptRecordings >= script.lines.length
              const isActive = idx === currentScriptIndex
              return (
                <button
                  key={script.id}
                  type="button"
                  onClick={() => {
                    setCurrentScriptIndex(idx)
                    setCurrentLineIndex(0)
                    clearRecording()
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--studio-accent)] text-white'
                      : isComplete
                        ? 'bg-[var(--studio-accent)]/20 text-[var(--studio-accent)] border border-[var(--studio-accent)]/30'
                        : 'bg-[var(--studio-glass-strong)] text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] border border-[var(--studio-border)]'
                  }`}
                >
                  {script.name} ({scriptRecordings}/{script.lines.length})
                </button>
              )
            })}
          </div>
        )}

        {showAudioControls && (
          <AudioControlsPanel
            gain={audioGain}
            bass={audioBass}
            treble={audioTreble}
            deviceId={audioDeviceId}
            onGainChange={setAudioGain}
            onBassChange={setAudioBass}
            onTrebleChange={setAudioTreble}
            onDeviceChange={setAudioDeviceId}
            audioLevel={audioLevel}
            isRecording={isRecording}
          />
        )}
      </BackgroundScene>

      {/* Back button - fixed */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-[var(--studio-glass)] border border-[var(--studio-border)] text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] hover:bg-[var(--studio-glass-strong)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]"
        aria-label="Back to home"
      >
        <LiquidMetalIcon size={20}>
          <ChevronLeft size={20} />
        </LiquidMetalIcon>
      </button>
    </div>
  )
}
