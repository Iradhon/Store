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
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import './styles/auth.css'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user, isLoading: isAuthLoading, isConfigured, signIn, signUp, requestPasswordReset, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Find redirect destination or default to home
  const from = (location.state as { from?: string })?.from || '/'

  const isPasswordRecovery = new URLSearchParams(location.search).get('reset') === '1' && Boolean(user)

  async function handlePasswordReset() {
    if (!email.trim()) {
      setErrorMessage('Enter your email address first.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    const result = await requestPasswordReset(email)
    setIsSubmitting(false)
    if (!result.success) {
      setErrorMessage(result.error || 'Could not send the password reset email.')
      return
    }
    setSuccessMessage('If an account exists for that address, a password reset email has been sent.')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      if (isPasswordRecovery) {
        if (password.length < 8) {
          setErrorMessage('Your new password must be at least 8 characters.')
          setIsSubmitting(false)
          return
        }
        const result = await updatePassword(password)
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to update your password.')
          setIsSubmitting(false)
        } else {
          await signOut()
          navigate('/auth', { replace: true })
        }
      } else if (mode === 'reset') {
        await handlePasswordReset()
      } else if (mode === 'signin') {
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
        } else if (result.needsEmailConfirmation) {
          setSuccessMessage('Check your email to confirm your account before signing in.')
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

  if (isAuthLoading) {
    return <div className="auth-page" role="status">Loading account…</div>
  }

  if (user && !isPasswordRecovery) {
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
        {/* Account service status */}
        <div className="auth-status-pill">
          <UserIcon size={14} />
          <span>{isConfigured ? 'Account access active' : 'Account access unavailable'}</span>
        </div>

        <div className="auth-card">
          {/* Tabs */}
          {!isPasswordRecovery && mode !== 'reset' && <div className="auth-tabs" role="tablist">
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
          </div>}

          {mode === 'reset' && !isPasswordRecovery && (
            <button type="button" className="auth-forgot-link" onClick={() => setMode('signin')}>
              Return to sign in
            </button>
          )}

          <div className="auth-header">
            <h1 className="auth-title">
              {isPasswordRecovery ? 'Choose a New Password' : mode === 'signin' ? 'Welcome Back' : mode === 'reset' ? 'Reset Your Password' : 'Create an Account'}
            </h1>
            <p className="auth-subtitle">
              {isPasswordRecovery
                ? 'Enter a new password for your account.'
                : mode === 'reset'
                  ? 'Enter your account email and we will send a password reset link.'
                  : mode === 'signin'
                ? 'Enter your credentials to access your account and orders.'
                : 'Create an account to manage your profile and future orders.'}
            </p>
          </div>

          {/* Feedback messages */}
          {!isConfigured && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>Set the Supabase project URL and publishable key in the environment to enable account access.</span>
            </div>
          )}

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
            {mode === 'signup' && !isPasswordRecovery && (
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

            {!isPasswordRecovery && <div className="auth-field">
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
            </div>}

            {(mode !== 'reset' || isPasswordRecovery) && <div className="auth-field">
              <div className="auth-field__header">
                <label htmlFor="auth-password">{isPasswordRecovery ? 'New Password' : 'Password'}</label>
                {mode === 'signin' && !isPasswordRecovery && (
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => {
                      setMode('reset')
                      setErrorMessage(null)
                      setSuccessMessage(null)
                    }}
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
                  minLength={mode === 'signup' || isPasswordRecovery ? 8 : undefined}
                  placeholder={mode === 'signup' || isPasswordRecovery ? 'At least 8 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' && !isPasswordRecovery ? 'current-password' : 'new-password'}
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
            </div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting || !isConfigured}
            >
              {isSubmitting ? (
                <span>{isPasswordRecovery ? 'Updating Password...' : mode === 'reset' ? 'Sending Link...' : mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              ) : (
                <>
                  <span>{isPasswordRecovery ? 'Update Password' : mode === 'reset' ? 'Send Reset Link' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-card__footer">
            <div className="auth-security-badge">
              <ShieldCheck size={16} />
              <span>Passwords are handled by the account service and are never stored by this app.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
