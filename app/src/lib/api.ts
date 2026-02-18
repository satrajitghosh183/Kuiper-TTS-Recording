// API client for Kuyper TTS backend

import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')

/** Direct Supabase Storage URL - bypasses API, no CORS to Render. */
export function getRecordingStorageUrl(storagePath: string): string {
  if (!SUPABASE_URL || !storagePath) return ''
  return `${SUPABASE_URL}/storage/v1/object/public/recordings/${storagePath}`
}

/** Get auth headers for recording endpoints (requires signed-in user) */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

// ============================================================================
// Types
// ============================================================================

export interface Script {
  id: number
  name: string
  lines: string[]
  line_count: number
  created_at?: string
}

export interface Recording {
  id: number
  script_id: number
  script_name: string
  line_index: number
  recorder_name: string
  phrase_text: string
  text: string
  filename: string
  duration_seconds: number
  peak_amplitude: number
  rms_level: number
  is_valid: boolean
  storage_path?: string
  created_at?: string
}

export interface RecordingProgress {
  script_id: number
  script_name: string
  recorded: number
  total: number
  remaining: number
  percent: number
}

export interface SaveRecordingResult {
  success: boolean
  id?: number
  storage_path?: string
  duration_seconds: number
  peak_amplitude: number
  rms_level: number
  is_valid: boolean
  error: string | null
}

export interface UserSettings {
  gain: number
  bass: number
  treble: number
  device_id: string | null
}

// ============================================================================
// Fetch Helpers
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface FetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: object | FormData
  auth?: boolean // if true, add Authorization: Bearer <session token>
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { body, auth, ...rest } = options

  const headers: Record<string, string> = {
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...rest.headers,
  }

  if (auth) {
    const authHeaders = await getAuthHeaders()
    Object.assign(headers, authHeaders)
  }

  const config: RequestInit = {
    ...rest,
    headers,
  }

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new APIError(
        error.detail || `HTTP ${response.status}`,
        response.status,
        error.detail
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'Could not connect to the server.'
    )
  }
}

// ============================================================================
// API Methods
// ============================================================================

export const api = {
  // Health
  async health(): Promise<{ status: string; version: string }> {
    return fetchAPI('/health')
  },

  async isServerAvailable(): Promise<boolean> {
    try {
      await this.health()
      return true
    } catch {
      return false
    }
  },

  /** Fetch TTS pronunciation audio for the given text. */
  async pronounceText(text: string, lang = 'en'): Promise<Blob> {
    const params = new URLSearchParams({ text, lang })
    const response = await fetch(`${API_BASE}/tts/pronounce?${params}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'TTS failed' }))
      throw new APIError(err.detail || `HTTP ${response.status}`, response.status, err.detail)
    }
    return response.blob()
  },

  // Scripts
  async listScripts(): Promise<Script[]> {
    return fetchAPI('/scripts')
  },

  async getScript(scriptId: number): Promise<Script> {
    return fetchAPI(`/scripts/${scriptId}`)
  },

  // Recordings
  async saveRecording(
    audioBlob: Blob,
    scriptId: number,
    lineIndex: number,
    phraseText: string
  ): Promise<SaveRecordingResult> {
    const formData = new FormData()
    formData.append('audio_file', audioBlob, 'recording.wav')
    formData.append('script_id', scriptId.toString())
    formData.append('line_index', lineIndex.toString())
    formData.append('phrase_text', phraseText)

    return fetchAPI('/recording/save', {
      method: 'POST',
      body: formData,
      auth: true,
    })
  },

  async listRecordings(scriptId?: number): Promise<Recording[]> {
    const params = scriptId !== undefined ? `?script_id=${scriptId}` : ''
    return fetchAPI(`/recording/list${params}`, { auth: true })
  },

  async getRecordingProgress(): Promise<RecordingProgress[]> {
    return fetchAPI('/recording/progress', { auth: true })
  },

  // User settings (per-account audio profile)
  async getUserSettings(): Promise<UserSettings> {
    return fetchAPI('/user/settings', { auth: true })
  },

  async updateUserSettings(settings: UserSettings): Promise<UserSettings> {
    return fetchAPI('/user/settings', {
      method: 'PUT',
      body: settings,
      auth: true,
    })
  },

  async createScriptFromFile(file: File, adminPassword: string, name?: string): Promise<Script> {
    const formData = new FormData()
    formData.append('file', file)
    if (name) formData.append('name', name)

    return fetchAPI('/admin/scripts/from-file', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminPassword },
      body: formData,
    })
  },

  getRecordingAudioUrl(recordingId: number): string {
    return `${API_BASE}/recordings/${recordingId}/audio`
  },

  /** Fetch recording audio. Uses direct Supabase Storage URL when storagePath provided (bypasses API/CORS). */
  async fetchRecordingAudio(recordingId: number, storagePath?: string): Promise<Blob> {
    const url = storagePath ? getRecordingStorageUrl(storagePath) : ''
    if (url) {
      const response = await fetch(url)
      if (!response.ok) throw new APIError(`Failed to load audio`, response.status)
      return response.blob()
    }
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE}/recordings/${recordingId}/audio`, {
      headers,
      credentials: 'include',
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to load audio' }))
      throw new APIError(err.detail || `HTTP ${response.status}`, response.status, err.detail)
    }
    return response.blob()
  },

  async deleteRecording(recordingId: number): Promise<{ success: boolean }> {
    return fetchAPI(`/recordings/${recordingId}`, {
      method: 'DELETE',
      auth: true,
    })
  },

  /** Download all user recordings as a ZIP. Fetches from Supabase Storage when storage_path available (bypasses API/CORS). */
  async downloadRecordingsAsZip(recordings: Array<{ id: number; script_name: string; line_index: number; phrase_text: string; storage_path?: string }>): Promise<Blob> {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const rec of recordings) {
      const blob = await this.fetchRecordingAudio(rec.id, rec.storage_path)
      const safeName = `${rec.script_name}_${String(rec.line_index + 1).padStart(4, '0')}.wav`
        .replace(/[^a-zA-Z0-9_.-]/g, '_')
      zip.file(safeName, blob)
    }
    return zip.generateAsync({ type: 'blob' })
  },

  // Admin (requires API key)
  async createScript(name: string, lines: string[], adminPassword: string): Promise<Script> {
    return fetchAPI('/admin/scripts', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminPassword },
      body: { name, lines },
    })
  },

  async updateScript(scriptId: number, name: string, lines: string[], adminPassword: string): Promise<Script> {
    return fetchAPI(`/admin/scripts/${scriptId}`, {
      method: 'PUT',
      headers: { 'X-Admin-Key': adminPassword },
      body: { name, lines },
    })
  },

  async deleteScript(scriptId: number, adminPassword: string): Promise<{ success: boolean }> {
    return fetchAPI(`/admin/scripts/${scriptId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminPassword },
    })
  },
}

// Helper to format duration
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
