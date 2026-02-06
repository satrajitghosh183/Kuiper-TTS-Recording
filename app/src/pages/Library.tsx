import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, Trash2, ChevronLeft } from 'lucide-react'
import { api, type Recording, formatDuration } from '../lib/api'
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
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const recs = await api.listRecordings()
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
        setError('Failed to load recordings.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handlePlayPause = (recordingId: number) => {
    const map = audioRefs.current
    const audio = map.get(recordingId)
    if (!audio) return

    // Pause any other playing audio
    map.forEach((el, id) => {
      if (id !== recordingId) {
        el.pause()
      }
    })

    if (audio.paused) {
      audio.play().catch((err) => console.warn('Failed to play audio', err))
      setCurrentId(recordingId)
    } else {
      audio.pause()
      setCurrentId(null)
    }
  }

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
      if (currentId === recordingId) setCurrentId(null)
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
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-[var(--studio-accent)] text-[var(--studio-bg-0)] hover:brightness-110 transition-colors inline-flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Back
          </button>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--studio-text-0)' }}>
            Your Recordings
          </h1>
          <p className="text-sm" style={{ color: 'var(--studio-text-2)' }}>
            Browse, listen back, and manage your takes grouped by script.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-xl bg-[var(--studio-glass)] border border-[var(--studio-border)] text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)] hover:bg-[var(--studio-glass-strong)] transition-all flex items-center gap-2"
        >
          <ChevronLeft size={18} />
          Home
        </button>
      </div>

      <div className="space-y-10">
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
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: 'var(--studio-accent)',
                          color: 'var(--studio-bg-0)',
                        }}
                        aria-label={currentId === rec.id ? 'Pause' : 'Play'}
                      >
                        <LiquidMetalIcon size={16}>
                          {currentId === rec.id ? <Pause size={16} /> : <Play size={16} />}
                        </LiquidMetalIcon>
                      </button>
                      <div className="w-24 h-1.5 rounded-full overflow-hidden bg-[var(--studio-border)]">
                        {/* Simple progress bar driven by native controls visually; not bound to time for now */}
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: currentId === rec.id ? '100%' : '0%',
                            background: 'var(--studio-accent)',
                            transition: 'width 0.4s ease-out',
                          }}
                        />
                      </div>
                      <audio
                        ref={(el) => {
                          const map = audioRefs.current
                          if (el) map.set(rec.id, el)
                          else map.delete(rec.id)
                        }}
                        src={api.getRecordingAudioUrl(rec.id)}
                        onEnded={() => setCurrentId((id) => (id === rec.id ? null : id))}
                      />
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

