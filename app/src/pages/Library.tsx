import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, Trash2, ChevronLeft, Loader2, Download } from 'lucide-react'
import { api, APIError, type Recording, formatDuration } from '../lib/api'
import { LiquidMetalIcon } from '../components/LiquidMetalIcon'

interface GroupedRecordings {
  scriptName: string
  recordings: Recording[]
}

export function Library() {
  const navigate = useNavigate()
  const [grouped, setGrouped] = useState<GroupedRecordings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [playError, setPlayError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const loadRecordings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      let recs: Recording[]
      try {
        recs = await api.listRecordings()
      } catch (firstErr) {
        await new Promise((r) => setTimeout(r, 2500))
        recs = await api.listRecordings()
      }
      const byScript = new Map<string, Recording[]>()
      recs.forEach((r) => {
        const key = r.script_name || `Script ${r.script_id}`
        if (!byScript.has(key)) byScript.set(key, [])
        byScript.get(key)!.push(r)
      })
      const groups: GroupedRecordings[] = Array.from(byScript.entries()).map(([scriptName, recordings]) => ({
        scriptName,
        recordings: recordings.sort((a, b) => a.line_index - b.line_index),
      }))
      setGrouped(groups)
    } catch (err) {
      console.error('Failed to load recordings', err)
      setError('Failed to load recordings. The server may be starting up - try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecordings()
  }, [loadRecordings])

  const handlePlayPause = useCallback(async (recordingId: number) => {
    if (currentId === recordingId && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      setCurrentId(null)
      return
    }

    setPlayError(null)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    const fetchWithRetry = async (): Promise<Blob> => {
      try {
        return await api.fetchRecordingAudio(recordingId)
      } catch (firstErr) {
        const isRetryable =
          firstErr instanceof TypeError && firstErr.message === 'Failed to fetch' ||
          (firstErr instanceof APIError && firstErr.status >= 500)
        if (isRetryable) {
          await new Promise((r) => setTimeout(r, 2500))
          return api.fetchRecordingAudio(recordingId)
        }
        throw firstErr
      }
    }

    try {
      setLoadingId(recordingId)
      const blob = await fetchWithRetry()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      const audio = new Audio(url)
      audio.onended = () => {
        setCurrentId(null)
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
      }
      audioRef.current = audio
      await audio.play()
      setCurrentId(recordingId)
    } catch (err) {
      console.warn('Playback failed:', err)
      const msg =
        err instanceof APIError
          ? err.detail || err.message
          : err instanceof Error
            ? err.message
            : 'Playback failed'
      setPlayError(msg)
    } finally {
      setLoadingId(null)
    }
  }, [currentId])

  const handleDownload = useCallback(async () => {
    const all = grouped.flatMap((g) => g.recordings)
    if (all.length === 0) return
    setDownloading(true)
    setPlayError(null)
    const doDownload = () =>
      api.downloadRecordingsAsZip(
        all.map((r) => ({
          id: r.id,
          script_name: r.script_name,
          line_index: r.line_index,
          phrase_text: r.phrase_text,
        }))
      )
    try {
      let zip: Blob
      try {
        zip = await doDownload()
      } catch (firstErr) {
        await new Promise((r) => setTimeout(r, 2500))
        zip = await doDownload()
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(zip)
      a.download = `kuiper-recordings-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      console.error('Download failed:', err)
      const msg =
        err instanceof APIError
          ? err.detail || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to download'
      setPlayError(msg)
      window.alert(msg + ' The server may be starting up - try again in a few seconds.')
    } finally {
      setDownloading(false)
    }
  }, [grouped])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleDelete = async (recordingId: number) => {
    if (!window.confirm('Delete this recording? This cannot be undone.')) return
    try {
      await api.deleteRecording(recordingId)
      setGrouped((prev) =>
        prev
          .map((g) => ({
            ...g,
            recordings: g.recordings.filter((r) => r.id !== recordingId),
          }))
          .filter((g) => g.recordings.length > 0),
      )
      if (currentId === recordingId) {
        setCurrentId(null)
        if (audioRef.current) audioRef.current.pause()
      }
    } catch (err) {
      console.error('Failed to delete recording', err)
      window.alert('Failed to delete recording. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-[var(--studio-text-1)]">Loading your recordings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div
          className="studio-card rounded-3xl p-8 text-center"
        >
          <p className="text-[var(--studio-text-1)] mb-4">{error}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => loadRecordings()}
              className="px-4 py-2 rounded-xl bg-[var(--studio-accent)] text-[var(--studio-bg-0)] hover:brightness-110 transition-colors inline-flex items-center gap-2"
            >
              Try again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl bg-[var(--studio-glass)] border border-[var(--studio-border)] text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] transition-colors inline-flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (grouped.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="text-body-lg mb-4" style={{ color: 'var(--studio-text-0)' }}>
          You haven&apos;t recorded anything yet.
        </p>
        <p className="text-body mb-6" style={{ color: 'var(--studio-text-1)' }}>
          Start in the Recording Studio, then come back here to review and manage your takes.
        </p>
        <button
          onClick={() => navigate('/record')}
          className="px-6 py-3 rounded-2xl bg-[var(--studio-accent)] text-[var(--studio-bg-0)] hover:brightness-110 transition-all"
        >
          Go to Recording Studio
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--studio-text-0)' }}>
            Your Recordings
          </h1>
          <p className="text-sm" style={{ color: 'var(--studio-text-2)' }}>
            Browse, listen back, and manage your takes grouped by script.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-[var(--studio-accent)] text-[var(--studio-bg-0)] hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            aria-label="Download my recordings"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download my recordings
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-2 rounded-xl bg-[var(--studio-glass)] border border-[var(--studio-border)] text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] hover:bg-[var(--studio-glass-strong)] transition-all flex items-center gap-2 min-h-[44px]"
          >
            <ChevronLeft size={18} />
            Home
          </button>
        </div>
      </div>

      {playError && (
        <div
          className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{
            background: 'rgba(255, 69, 58, 0.15)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
          }}
        >
          <p className="text-sm text-[var(--studio-accent-recording)]">{playError}</p>
        </div>
      )}

      <div className="space-y-10">
        {/* Single shared audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => {
            setCurrentId(null)
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current)
              objectUrlRef.current = null
            }
          }}
        />
        {grouped.map((group) => (
          <section key={group.scriptName}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--studio-text-0)' }}>
              {group.scriptName}
            </h2>
            <div className="space-y-3">
              {group.recordings.map((rec) => (
                <div
                  key={rec.id}
                  className="studio-card rounded-3xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--studio-text-0)' }}>
                      Line {rec.line_index + 1}: {rec.phrase_text}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--studio-text-2)' }}>
                      {formatDuration(rec.duration_seconds || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini player UI */}
                    <div
                      className="relative flex items-center gap-3 rounded-full px-4 py-2"
                      style={{
                        background: 'var(--studio-glass)',
                        border: '1px solid var(--studio-border-apple)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handlePlayPause(rec.id)}
                        disabled={loadingId === rec.id}
                        className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center"
                        style={{
                          background: 'var(--studio-accent)',
                          color: 'var(--studio-bg-0)',
                        }}
                        aria-label={currentId === rec.id ? 'Pause' : 'Play'}
                      >
                        <LiquidMetalIcon size={16}>
                          {loadingId === rec.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : currentId === rec.id ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </LiquidMetalIcon>
                      </button>
                      <div className="w-24 h-1.5 rounded-full overflow-hidden bg-[var(--studio-border)]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: currentId === rec.id ? '100%' : '0%',
                            background: 'var(--studio-accent)',
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--studio-border)',
                        color: 'var(--studio-text-2)',
                      }}
                      aria-label="Delete recording"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

