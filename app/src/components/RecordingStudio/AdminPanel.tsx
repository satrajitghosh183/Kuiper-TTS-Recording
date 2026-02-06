import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { api, type Script } from '../../lib/api'

interface AdminPanelProps {
  className?: string
}

export function AdminPanel({ className = '' }: AdminPanelProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.listScripts()
        setScripts(list)
      } catch {
        setScripts([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`studio-admin w-full max-w-2xl mx-auto mt-12 ${className}`}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--admin-bg)',
          border: '1px solid var(--admin-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Grid background */}
        <div
          className="relative p-8"
          style={{
            backgroundImage: `
              linear-gradient(var(--admin-grid) 1px, transparent 1px),
              linear-gradient(90deg, var(--admin-grid) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        >
          <h3
            className="text-lg font-medium mb-6"
            style={{ color: 'var(--admin-text)' }}
          >
            Script Management
          </h3>

          {/* Upload zone */}
          <div
            className={`mb-8 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging ? 'border-[var(--studio-accent)] bg-[var(--studio-accent)]/5' : ''
            }`}
            style={{
              borderColor: isDragging ? 'var(--studio-accent)' : 'var(--admin-border)',
              background: 'var(--admin-surface)',
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload
              size={32}
              className="mx-auto mb-3 opacity-50"
              style={{ color: 'var(--admin-text-muted)' }}
            />
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--admin-text)' }}
            >
              Drop .txt file here or click to upload
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              One phrase per line
            </p>
          </div>

          {/* Script cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              <div className="col-span-2 flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--admin-text-muted)' }} />
              </div>
            ) : scripts.length === 0 ? (
              <div
                className="col-span-2 text-center py-8 rounded-xl"
                style={{
                  background: 'var(--admin-surface)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <FileText size={24} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--admin-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  No scripts yet
                </p>
              </div>
            ) : (
              scripts.slice(0, 6).map((script) => (
                <div
                  key={script.id}
                  className="rounded-xl p-4 transition-shadow hover:shadow-md"
                  style={{
                    background: 'var(--admin-surface)',
                    border: '1px solid var(--admin-border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--admin-text)' }}>
                    {script.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>
                    {script.line_count} lines
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
