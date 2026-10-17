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

  const { user, signIn, signUp, signInWithGoogle, signOut, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Find redirect destination or default to home
  const from = (location.state as { from?: string })?.from || '/'

  async function handleGoogleSignIn() {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    const result = await signInWithGoogle()
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to sign in with Google.')
      setIsSubmitting(false)
    }
  }

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

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

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
