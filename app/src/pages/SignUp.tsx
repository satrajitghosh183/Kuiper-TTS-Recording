import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2, AlertCircle, Check } from 'lucide-react'
import { Button, Card, AuthLayout } from '../components'
import { supabase } from '../lib/supabase'

export function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      if (user && !user.email_confirmed_at) {
        setSuccess(true)
        setEmail('')
        setPassword('')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout loading={false}>
        <Card variant="elevated" className="text-center">
          <Check size={48} className="mx-auto mb-4" style={{ color: 'var(--studio-accent)' }} />
          <h1 className="text-h2 mb-2" style={{ color: 'var(--studio-text-0)' }}>Check your email</h1>
          <p className="text-body mb-lg" style={{ color: 'var(--studio-text-1)' }}>
            We sent a confirmation link to your email. Click the link to verify your account, then sign in.
          </p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout loading={loading}>
      <Card variant="elevated" className="text-center">
        <UserPlus size={48} className="mx-auto mb-4" style={{ color: 'var(--studio-accent)' }} />
        <h1 className="text-h2 mb-2" style={{ color: 'var(--studio-text-0)' }}>Create Account</h1>
        <p className="text-body mb-lg" style={{ color: 'var(--studio-text-1)' }}>
          Sign up with your email and password.
        </p>

        <form onSubmit={handleSignUp} className="space-y-4 text-left">
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
              minLength={6}
              className="input w-full"
            />
            <p className="text-micro mt-1" style={{ color: 'var(--studio-text-2)' }}>At least 6 characters</p>
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
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </Button>
        </form>

        <p className="text-body mt-lg" style={{ color: 'var(--studio-text-1)' }}>
          Already have an account?{' '}
          <Link to="/login" className="hover:underline" style={{ color: 'var(--studio-accent)' }}>
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
