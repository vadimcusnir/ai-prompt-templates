'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClientSideClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { logger, logSecurity, logError } from '@/lib/logger'

type UserTier = 'free' | 'architect' | 'initiate' | 'elite'

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
  const [userTier, setUserTier] = useState<UserTier>('free')
  
  const supabase = createClientSideClient()

  const getUserTier = useCallback(async (userId: string) => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (error || !subscription) {
        // No active subscription, user is free tier
        logger.info('User has no active subscription, defaulting to free tier', { userId })
        setUserTier('free')
      } else {
        logger.info('User tier retrieved successfully', { 
          userId, 
          tier: subscription.tier 
        })
        setUserTier(subscription.tier as UserTier)
      }
    } catch (error) {
      logError('Error getting user tier', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
              setUserTier('free')
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logError('Error getting session', { error: error.message })
        } else {
          setUser(session?.user ?? null)
          if (session?.user) {
            await getUserTier(session.user.id)
          }
        }
      } catch (error) {
        logError('Session error', { error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', { 
          event, 
          userEmail: session?.user?.email ? session.user.email.substring(0, 3) + '***@' + session.user.email.split('@')[1] : 'none'
        })
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await getUserTier(session.user.id)
        } else {
          setUserTier('free')
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [getUserTier, supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logError('Sign in failed', { 
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          error: error.message 
        })
        return { error: error.message }
      }

      logger.info('User signed in successfully', { 
        userId: data.user?.id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1]
      })

      return {}
    } catch (error) {
      logError('Unexpected error during sign in', { 
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
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
        logError('Sign up failed', { 
          email: email.substring(0, 3) + '***@' + email.split('@')[1],
          error: error.message 
        })
        return { error: error.message }
      }

      if (data.user && !data.user.email_confirmed_at) {
        logger.info('User signup successful, email confirmation required', { 
          userId: data.user.id,
          email: email.substring(0, 3) + '***@' + email.split('@')[1]
        })
        return { error: 'Please check your email to confirm your account' }
      }

      logger.info('User signup successful', { 
        userId: data.user?.id,
        email: email.substring(0, 3) + '***@' + email.split('@')[1]
      })

      return {}
    } catch (error) {
      logError('Unexpected error during sign up', { 
        email: email.substring(0, 3) + '***@' + email.split('@')[1],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        logError('Sign out error', { error: error.message })
      } else {
        logger.info('User signed out successfully', { 
          userId: user?.id,
          email: user?.email ? user.email.substring(0, 3) + '***@' + user.email.split('@')[1] : 'unknown'
        })
      }
    } catch (error) {
      logError('Sign out error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
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