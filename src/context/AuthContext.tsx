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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          fullName: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0],
          createdAt: session.user.created_at,
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          fullName: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0],
          createdAt: session.user.created_at,
        })
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
          setUser({
            id: data.user.id,
            email: data.user.email ?? '',
            fullName: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0],
            createdAt: data.user.created_at,
          })
        }
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Sign in failed.' }
      }
    }

    // Local authentication fallback for instant demo/development
    await new Promise((resolve) => setTimeout(resolve, 400))
    const mockUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      email: email.trim().toLowerCase(),
      fullName: email.split('@')[0],
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
          setUser({
            id: data.user.id,
            email: data.user.email ?? '',
            fullName: fullName || data.user.email?.split('@')[0],
            createdAt: data.user.created_at,
          })
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
