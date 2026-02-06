import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Key,
  AlertCircle,
  Check,
  Loader2,
  Upload,
} from 'lucide-react'
import { Button, Card } from '../components'
import { api, type Script } from '../lib/api'

export function Admin() {
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('kuiper_admin_password') || '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create/Edit state
  const [showForm, setShowForm] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [formName, setFormName] = useState('')
  const [formLines, setFormLines] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)

  const loadScripts = async () => {
    try {
      setIsLoading(true)
      const loaded = await api.listScripts()
      setScripts(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scripts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadScripts()
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    if (!adminPassword.trim()) return
    localStorage.setItem('kuiper_admin_password', adminPassword)
    setIsAuthenticated(true)
  }

  const handleCreate = () => {
    setEditingScript(null)
    setFormName('')
    setFormLines('')
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const handleUploadFile = async () => {
    if (!uploadFile || !uploadFile.name.toLowerCase().endsWith('.txt')) {
      setError('Please select a .txt file')
      return
    }

    try {
      setUploadLoading(true)
      setError(null)
      await api.createScriptFromFile(uploadFile, adminPassword, uploadName || undefined)
      const name = uploadName || uploadFile.name.replace(/\.txt$/i, '')
      setSuccess(`Script "${name}" created from file`)
      setUploadFile(null)
      setUploadName('')
      await loadScripts()
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('Invalid admin password')
        setIsAuthenticated(false)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload script')
      }
    } finally {
      setUploadLoading(false)
    }
  }

  const handleEdit = (script: Script) => {
    setEditingScript(script)
    setFormName(script.name)
    setFormLines(script.lines.join('\n'))
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (script: Script) => {
    if (!confirm(`Delete script "${script.name}" and all its recordings?`)) return

    try {
      setError(null)
      await api.deleteScript(script.id, adminPassword)
      setSuccess(`Script "${script.name}" deleted`)
      await loadScripts()
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('Invalid admin password')
        setIsAuthenticated(false)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete script')
      }
    }
  }

  const handleSave = async () => {
    const name = formName.trim()
    const lines = formLines.split('\n').filter(l => l.trim().length > 0)

    if (!name) {
      setError('Script name is required')
      return
    }
    if (lines.length === 0) {
      setError('At least one line is required')
      return
    }

    try {
      setFormLoading(true)
      setError(null)

      if (editingScript) {
        await api.updateScript(editingScript.id, name, lines, adminPassword)
        setSuccess(`Script "${name}" updated`)
      } else {
        await api.createScript(name, lines, adminPassword)
        setSuccess(`Script "${name}" created`)
      }

      setShowForm(false)
      await loadScripts()
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('Invalid admin password')
        setIsAuthenticated(false)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save script')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="elevated" className="text-center">
          <Key size={48} className="mx-auto mb-4" style={{ color: 'var(--studio-accent)' }} />
          <h1 className="text-h2 mb-2" style={{ color: 'var(--studio-text-0)' }}>Admin Access</h1>
          <p className="text-body mb-lg" style={{ color: 'var(--studio-text-1)' }}>
            Enter the admin password to manage scripts.
          </p>

          <div className="space-y-4">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Admin password"
              className="input w-full"
            />
            <Button variant="primary" onClick={handleLogin} className="w-full">
              Authenticate
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--studio-text-0)' }}>Script Management</h1>
          <p className="text-body" style={{ color: 'var(--studio-text-1)' }}>
            Create and manage recording scripts for users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            New Script
          </Button>
        </div>
      </div>

      {/* Upload .txt */}
      <Card variant="elevated" className="mb-lg">
        <h2 className="text-h3 mb-2" style={{ color: 'var(--studio-text-0)' }}>Upload Text File</h2>
        <p className="text-caption mb-4" style={{ color: 'var(--studio-text-1)' }}>
          Upload a .txt file with one phrase per line. Each line becomes a phrase to record. Stored in the database.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-caption mb-1" style={{ color: 'var(--studio-text-1)' }}>Select .txt file</label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="input w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[var(--studio-accent)] file:text-[var(--studio-bg-0)] file:font-medium"
            />
          </div>
          <div>
            <label className="block text-caption mb-1" style={{ color: 'var(--studio-text-1)' }}>
              Script name (optional, defaults to filename)
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="e.g., LauraVoice"
              className="input w-full"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleUploadFile}
            disabled={!uploadFile || uploadLoading}
          >
            {uploadLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload & Save to Database
          </Button>
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div>
          <Card
            className="mb-md"
            style={{
              background: 'rgba(255, 69, 58, 0.12)',
              border: '1px solid rgba(255, 69, 58, 0.35)',
            }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} style={{ color: 'var(--studio-accent-recording)' }} />
              <p className="text-body flex-1" style={{ color: 'var(--studio-accent-recording)' }}>{error}</p>
              <button
                onClick={() => setError(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--studio-accent-recording)' }}
              >
                <X size={16} />
              </button>
            </div>
          </Card>
        </div>
      )}

      {success && (
        <div>
          <Card
            className="mb-md"
            style={{
              background: 'var(--studio-accent-muted)',
              border: '1px solid var(--studio-accent)',
            }}
          >
            <div className="flex items-center gap-3">
              <Check size={20} style={{ color: 'var(--studio-accent)' }} />
              <p className="text-body flex-1" style={{ color: 'var(--studio-accent)' }}>{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--studio-accent)' }}
              >
                <X size={16} />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div>
          <Card variant="elevated" className="mb-lg">
            <h2 className="text-h3 mb-md" style={{ color: 'var(--studio-text-0)' }}>
              {editingScript ? 'Edit Script' : 'New Script'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-caption mb-1" style={{ color: 'var(--studio-text-1)' }}>Script Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., phoneme_coverage"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-caption mb-1" style={{ color: 'var(--studio-text-1)' }}>
                  Lines (one sentence per line)
                </label>
                <textarea
                  value={formLines}
                  onChange={(e) => setFormLines(e.target.value)}
                  placeholder="Please put the book on the table near the window.&#10;The cat sat on the mat and looked at three birds.&#10;..."
                  rows={12}
                  className="input w-full font-mono text-sm resize-y min-h-[200px]"
                />
                <p className="text-micro mt-1" style={{ color: 'var(--studio-text-2)' }}>
                  {formLines.split('\n').filter(l => l.trim()).length} lines
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingScript ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scripts List */}
      {isLoading ? (
        <div className="text-center py-xl">
          <Loader2 size={32} className="animate-spin mx-auto mb-2" style={{ color: 'var(--studio-accent)' }} />
          <p className="text-body" style={{ color: 'var(--studio-text-1)' }}>Loading scripts...</p>
        </div>
      ) : scripts.length === 0 ? (
        <div>
          <Card className="text-center py-xl">
            <p className="text-body-lg mb-4" style={{ color: 'var(--studio-text-1)' }}>
              No scripts yet. Upload a .txt file above to add phrases to the database.
            </p>
            <Button variant="secondary" onClick={handleCreate}>
              <Plus size={18} />
              Or create manually
            </Button>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-h3" style={{ color: 'var(--studio-text-0)' }}>Scripts in database</h2>
          {scripts.map((script) => (
            <div key={script.id}>
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-h3" style={{ color: 'var(--studio-text-0)' }}>{script.name}</h3>
                    <p className="text-caption" style={{ color: 'var(--studio-text-1)' }}>
                      {script.line_count} lines
                    </p>
                    <p className="text-micro mt-1 truncate" style={{ color: 'var(--studio-text-2)' }}>
                      {script.lines[0]}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(script)}>
                      <Edit3 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(script)}>
                      <Trash2 size={16} style={{ color: 'var(--studio-accent-recording)' }} />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
