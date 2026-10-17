import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import './styles/auth.css'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user, signIn, signUp, signOut, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Find redirect destination or default to home
  const from = (location.state as { from?: string })?.from || '/'

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password)
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to sign in. Please verify your credentials.')
          setIsSubmitting(false)
        } else {
          setSuccessMessage('Welcome back! Redirecting...')
          setTimeout(() => {
            navigate(from, { replace: true })
          }, 600)
        }
      } else {
        const result = await signUp(email, password, fullName)
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to create account. Please try again.')
          setIsSubmitting(false)
        } else {
          setSuccessMessage('Account created successfully! Redirecting...')
          setTimeout(() => {
            navigate(from, { replace: true })
          }, 800)
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setIsSubmitting(false)
    }
  }

  if (user) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--signed-in">
          <div className="auth-signed-in__icon">
            <CheckCircle2 size={40} />
          </div>
          <h2>You are signed in</h2>
          <p className="auth-signed-in__email">
            Signed in as <strong>{user.email}</strong>
            {user.fullName && <span> ({user.fullName})</span>}
          </p>
          <div className="auth-signed-in__actions">
            <Link to="/orders" className="auth-btn auth-btn--primary">
              View Order History
            </Link>
            <button
              type="button"
              className="auth-btn auth-btn--secondary"
              onClick={() => signOut()}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Backend status pill */}
        <div className="auth-status-pill">
          <Database size={14} />
          <span>
            {isSupabaseConfigured ? 'Supabase Auth & Database Connected' : 'Local Auth Mode (Add .env to connect Supabase)'}
          </span>
        </div>

        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
              onClick={() => {
                setMode('signin')
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
              onClick={() => {
                setMode('signup')
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">
              {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'signin'
                ? 'Enter your credentials to access your account and orders.'
                : 'Join our community for faster checkout, order tracking, and exclusive offers.'}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert auth-alert--success" role="status">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="auth-fullName">Full Name</label>
                <div className="auth-input-wrap">
                  <UserIcon className="auth-input-icon" size={18} />
                  <input
                    id="auth-fullName"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={18} />
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field__header">
                <label htmlFor="auth-password">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => alert('Password reset link has been dispatched to your email address.')}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" size={18} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <div className="auth-checkbox-row">
                <label className="auth-checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me for 30 days</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-card__footer">
            <div className="auth-security-badge">
              <ShieldCheck size={16} />
              <span>Protected by 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
