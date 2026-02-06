import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Loader2, AlertCircle } from 'lucide-react'
import { Button, Card, AuthLayout } from '../components'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout loading={loading}>
      <Card variant="elevated" className="text-center">
        <LogIn size={48} className="mx-auto mb-4" style={{ color: 'var(--studio-accent)' }} />
        <h1 className="text-h2 mb-2" style={{ color: 'var(--studio-text-0)' }}>Sign In</h1>
        <p className="text-body mb-lg" style={{ color: 'var(--studio-text-1)' }}>
          Sign in with your email and password.
        </p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-caption mb-1" style={{ color: 'var(--studio-text-1)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-caption mb-1" style={{ color: 'var(--studio-text-1)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input w-full"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-body" style={{ color: 'var(--studio-accent-recording)' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </Button>
        </form>

        <p className="text-body mt-lg" style={{ color: 'var(--studio-text-1)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="hover:underline" style={{ color: 'var(--studio-accent)' }}>
            Create account
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
