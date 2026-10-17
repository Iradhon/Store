import { useEffect, useState, type ReactNode } from 'react'
import type { UserProfile } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './useAuth'

const LOCAL_STORAGE_USER_KEY = 'store_auth_user_v1'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY)
        return stored ? JSON.parse(stored) : null
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  async function resolveUserProfile(authUser: { id: string; email?: string; user_metadata?: Record<string, any>; created_at?: string }): Promise<UserProfile> {
    const email = (authUser.email ?? '').trim().toLowerCase()
    let role: 'admin' | 'customer' = email === 'honoreirad50@gmail.com' ? 'admin' : 'customer'
    let fullName = authUser.user_metadata?.full_name ?? email.split('@')[0]
    let avatarUrl: string | undefined

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', authUser.id)
          .maybeSingle()

        if (profile) {
          if (profile.role) role = profile.role as 'admin' | 'customer'
          if (profile.full_name) fullName = profile.full_name
          if (profile.avatar_url) avatarUrl = profile.avatar_url
        }
      } catch (e) {
        console.warn('Failed to load profile role:', e)
      }
    }

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      fullName,
      avatarUrl,
      role,
      createdAt: authUser.created_at,
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await resolveUserProfile(session.user)
        setUser(profile)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await resolveUserProfile(session.user)
        setUser(profile)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Persist local user if not using Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
      }
    }
  }, [user])

  async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          return { success: false, error: error.message }
        }
        if (data.user) {
          const profile = await resolveUserProfile(data.user)
          setUser(profile)
        }
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Sign in failed.' }
      }
    }

    // Local authentication fallback for instant demo/development
    await new Promise((resolve) => setTimeout(resolve, 400))
    const normalizedEmail = email.trim().toLowerCase()
    const mockUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      email: normalizedEmail,
      fullName: email.split('@')[0],
      role: normalizedEmail === 'honoreirad50@gmail.com' ? 'admin' : 'customer',
      createdAt: new Date().toISOString(),
    }
    setUser(mockUser)
    return { success: true }
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' }
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        if (error) {
          return { success: false, error: error.message }
        }
        if (data.user) {
          const profile = await resolveUserProfile(data.user)
          setUser(profile)
        }
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Sign up failed.' }
      }
    }

    // Local authentication fallback
    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      email: email.trim().toLowerCase(),
      fullName: fullName || email.split('@')[0],
      createdAt: new Date().toISOString(),
    }
    setUser(mockUser)
    return { success: true }
  }

  async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        })
        if (error) {
          return { success: false, error: error.message }
        }
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Google sign in failed.' }
      }
    }

    // Local authentication fallback for instant demo/development
    await new Promise((resolve) => setTimeout(resolve, 400))
    const mockUser: UserProfile = {
      id: 'usr_google_demo',
      email: 'honoreirad50@gmail.com',
      fullName: 'Iradhon (Google User)',
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
    setUser(mockUser)
    return { success: true }
  }

  async function signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
