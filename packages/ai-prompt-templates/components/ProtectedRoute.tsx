'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredTier?: 'explorer' | 'architect' | 'initiate' | 'master'
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  requiredTier = 'explorer',
  requireAuth = true,
  fallback
}: ProtectedRouteProps) {
  const { user, userTier, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Check if authentication is required
    if (requireAuth && !user) {
      router.push('/auth')
      return
    }

    // Check if user has required tier
    if (user && requiredTier !== 'explorer') {
      const tierOrder = ['explorer', 'architect', 'initiate', 'master']
      const userTierIndex = tierOrder.indexOf(userTier)
      const requiredTierIndex = tierOrder.indexOf(requiredTier)
      
      if (userTierIndex < requiredTierIndex) {
        router.push('/pricing')
        return
      }
    }
  }, [user, userTier, loading, requireAuth, requiredTier, router])

  // Show loading state
  if (loading) {
    return fallback || (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p style={{ color: '#6b7280' }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated (if required)
  if (requireAuth && !user) {
    return fallback || (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '1rem' }}>
            Authentication Required
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Please sign in to access this page.
          </p>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  // Check if user has required tier
  if (user && requiredTier !== 'explorer') {
    const tierOrder = ['explorer', 'architect', 'initiate', 'master']
    const userTierIndex = tierOrder.indexOf(userTier)
    const requiredTierIndex = tierOrder.indexOf(requiredTier)
    
    if (userTierIndex < requiredTierIndex) {
      return fallback || (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '1rem' }}>
              Tier Upgrade Required
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              This content requires a {requiredTier} tier or higher. Your current tier is {userTier}.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/pricing')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Upgrade Tier
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // User has access, render children
  return <>{children}</>
}
