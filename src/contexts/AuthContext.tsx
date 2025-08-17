'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientSideClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

type UserTier = 'explorer' | 'architect' | 'initiate' | 'master'

type AuthContextType = {
  user: User | null
  loading: boolean
  userTier: UserTier
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUserTier: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userTier, setUserTier] = useState<UserTier>('explorer')
  
  const supabase = createClientSideClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error.message)
        } else {
          setUser(session?.user ?? null)
          if (session?.user) {
            await getUserTier(session.user.id)
          }
        }
      } catch (error) {
        console.error('Session error:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await getUserTier(session.user.id)
        } else {
          setUserTier('explorer')
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const getUserTier = async (userId: string) => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (error || !subscription) {
        // No active subscription, user is explorer tier
        setUserTier('explorer')
      } else {
        setUserTier(subscription.tier as UserTier)
      }
    } catch (error) {
      console.error('Error getting user tier:', error)
      setUserTier('explorer')
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { error: 'Please check your email to confirm your account' }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error.message)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshUserTier = async () => {
    if (user) {
      await getUserTier(user.id)
    }
  }

  const value = {
    user,
    loading,
    userTier,
    signIn,
    signUp,
    signOut,
    refreshUserTier,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}