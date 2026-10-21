import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext } from './useAuth'

function toProfile(session: Session): UserProfile {
  const authUser = session.user
  const metadata = authUser.user_metadata ?? {}

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    fullName: typeof metadata.full_name === 'string' ? metadata.full_name : undefined,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
    role: 'customer',
    createdAt: authUser.created_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    let active = true
    let receivedAuthEvent = false

    const refreshProfile = (userId: string) => {
      window.setTimeout(() => {
        void supabase
          ?.from('profiles')
          .select('display_name, avatar_url, role')
          .eq('id', userId)
          .maybeSingle()
          .then(({ data }) => {
            if (!active || !data) return
            setUser((current) => current?.id === userId
              ? {
                  ...current,
                  fullName: data.display_name ?? current.fullName,
                  avatarUrl: data.avatar_url ?? current.avatarUrl,
                  role: data.role,
                }
              : current)
          })
      }, 0)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true
      setUser(session ? toProfile(session) : null)
      setIsLoading(false)
      if (session) refreshProfile(session.user.id)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedAuthEvent) return
      setUser(data.session ? toProfile(data.session) : null)
      setIsLoading(false)
      if (data.session) refreshProfile(data.session.user.id)
      if (error) console.error('Could not restore the account session.')
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Account access is not configured yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { success: false, error: error.message } : { success: true }
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> {
    if (!supabase) return { success: false, error: 'Account access is not configured yet.' }
    if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters.' }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    })
    if (error) return { success: false, error: error.message }
    return { success: true, needsEmailConfirmation: !data.session }
  }

  async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Account access is not configured yet.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth?reset=1`,
    })
    return error ? { success: false, error: error.message } : { success: true }
  }

  async function updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Account access is not configured yet.' }
    const { error } = await supabase.auth.updateUser({ password })
    return error ? { success: false, error: error.message } : { success: true }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        requestPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
