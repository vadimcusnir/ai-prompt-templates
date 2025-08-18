'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { formatPrice } from '@/lib/stripe'

interface UserPrompt {
  id: string
  title: string
  cognitive_category: string
  difficulty_tier: string
  price_cents: number
  created_at: string
}

export default function DashboardPage() {
  const { user, userTier, loading, signOut } = useAuth()
  const [userPrompts, setUserPrompts] = useState<UserPrompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  const fetchUserPrompts = useCallback(async () => {
    try {
      const response = await fetch('/api/prompts?tier=' + userTier)
      const data = await response.json()
      setUserPrompts(data.prompts || [])
    } catch (error) {
      console.error('Failed to fetch user prompts:', error)
    } finally {
      setPromptsLoading(false)
    }
  }, [userTier])

  useEffect(() => {
    if (user) {
      fetchUserPrompts()
    }
  }, [user, fetchUserPrompts])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div>Loading your dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'explorer': return '#10b981'
      case 'architect': return '#3b82f6'
      case 'initiate': return '#8b5cf6'
      case 'master': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'explorer': return 'Access to 20% preview content'
      case 'architect': return 'Access to 40% preview content + basic frameworks'
      case 'initiate': return 'Access to 70% content + advanced frameworks'
      case 'master': return 'Full access to all premium frameworks'
      default: return 'Basic access'
    }
  }

  return (
    <ProtectedRoute>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                Welcome back! 👋
              </h1>
              <p style={{ fontSize: '1rem', color: '#6b7280' }}>
                {user.email}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* User Tier Badge */}
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: getTierColor(userTier),
                color: 'white',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {userTier} Tier
              </div>
              
              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Your Tier
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getTierColor(userTier) }}>
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {getTierBenefits(userTier)}
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Available Frameworks
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                {userPrompts.length}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Based on your current tier
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Account Status
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                Active
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem' }}>
              Quick Actions
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/library')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Browse Library
              </button>
              
              <button
                onClick={() => router.push('/pricing')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Upgrade Tier
              </button>
            </div>
          </div>

          {/* Recent Frameworks */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem' }}>
              Available Frameworks
            </h2>
            
            {promptsLoading ? (
              <div>Loading frameworks...</div>
            ) : userPrompts.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '1rem' 
              }}>
                {userPrompts.slice(0, 6).map((prompt) => (
                  <div key={prompt.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      {prompt.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {prompt.cognitive_category.replace('_', ' ')} • {prompt.difficulty_tier}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#8b5cf6', fontWeight: '500' }}>
                      {formatPrice(prompt.price_cents)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No frameworks available for your current tier.</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}