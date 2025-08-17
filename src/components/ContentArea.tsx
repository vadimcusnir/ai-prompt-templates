'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createClientSideClient } from '@/lib/supabase'
import { getTierUpgradeMessage } from '@/lib/access-gating'
import { formatPrice } from '@/lib/pricing'

interface Prompt {
  id: string
  title: string
  cognitive_category: string
  difficulty_tier: string
  required_tier: string
  preview_content: string
  full_content: string
  implementation_guide: string | null
  use_cases: any
  meta_tags: string[]
  cognitive_depth_score: number
  pattern_complexity: number
  meaning_layers: string[]
  anti_surface_features: string[]
  base_price_cents: number
  hasFullAccess: boolean
  meta_title: string | null
  meta_description: string | null
  keywords: string[]
}

interface ContentAreaProps {
  promptId: string | null
  userTier: string
  loading: boolean
}

export function ContentArea({ promptId, userTier, loading }: ContentAreaProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const fetchPrompt = useCallback(async () => {
    if (!promptId) return
    
    setLoadingPrompt(true)
    try {
      const response = await fetch(`/api/prompts/${promptId}?tier=${userTier}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setPrompt(data.prompt)
      }
    } catch (error) {
      setError('Failed to fetch prompt')
    } finally {
      setLoadingPrompt(false)
    }
  }, [promptId, userTier])

  useEffect(() => {
    if (promptId) {
      fetchPrompt()
    }
  }, [promptId, fetchPrompt])

  if (loading || loadingPrompt) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>
          Loading cognitive framework...
        </div>
      </div>
    )
  }

  if (!promptId) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '1rem' }}>
          Select a framework to view
        </div>
        <div style={{ fontSize: '1rem', color: '#9ca3af' }}>
          Choose from the sidebar to explore cognitive frameworks
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>
          Framework not found
        </div>
        <div style={{ fontSize: '1rem', color: '#9ca3af' }}>
          The selected framework could not be loaded
        </div>
      </div>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'deep_analysis': 'Deep Analysis',
      'meaning_engineering': 'Meaning Engineering',
      'cognitive_frameworks': 'Cognitive Frameworks',
      'consciousness_mapping': 'Consciousness Mapping',
      'advanced_systems': 'Advanced Systems'
    }
    return labels[category] || category
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'explorer': '#10b981',
      'architect': '#3b82f6',
      'initiate': '#8b5cf6',
      'master': '#f59e0b'
    }
    return colors[tier] || '#6b7280'
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '2rem', 
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#1f2937',
          lineHeight: '1.3'
        }}>
          {prompt.title}
        </h1>

        {/* Meta Information */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {getCategoryLabel(prompt.cognitive_category)}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: getTierColor(prompt.required_tier),
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {prompt.required_tier}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            €{formatPrice(prompt.base_price_cents)}
          </span>
        </div>

        {/* Cognitive Metrics */}
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '0.375rem',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Cognitive Depth
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {prompt.cognitive_depth_score}/10
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Pattern Complexity
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {prompt.pattern_complexity}/5
            </div>
          </div>
        </div>

        {/* Access Status */}
        {!prompt.hasFullAccess && (
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#92400e',
              marginBottom: '0.5rem'
            }}>
              🔒 Limited Access
            </div>
            <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '1rem' }}>
              {getTierUpgradeMessage(userTier as any, prompt.required_tier as any)}
            </div>
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Upgrade to Access Full Content
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ lineHeight: '1.7' }}>
        {prompt.hasFullAccess ? (
          <div dangerouslySetInnerHTML={{ __html: prompt.full_content.replace(/\n/g, '<br/>') }} />
        ) : (
          <div>
            <div style={{ 
              fontSize: '1.125rem', 
              color: '#6b7280', 
              marginBottom: '1rem',
              fontStyle: 'italic'
            }}>
              {prompt.preview_content}
            </div>
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <strong>Preview Mode:</strong> You&apos;re seeing a limited preview of this framework. 
                Upgrade your tier to access the complete content, implementation guide, and use cases.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Implementation Guide */}
      {prompt.hasFullAccess && prompt.implementation_guide && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            color: '#1f2937'
          }}>
            Implementation Guide
          </h3>
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.375rem',
            border: '1px solid #e5e7eb'
          }}>
            {prompt.implementation_guide}
          </div>
        </div>
      )}

      {/* Use Cases */}
      {prompt.hasFullAccess && prompt.use_cases && Object.keys(prompt.use_cases).length > 0 && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            color: '#1f2937'
          }}>
            Use Cases
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.entries(prompt.use_cases).map(([key, value]) => (
              <div key={key} style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '0.5rem',
                  textTransform: 'capitalize'
                }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {value as string}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta Tags */}
      {prompt.meta_tags && prompt.meta_tags.length > 0 && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            color: '#1f2937'
          }}>
            Tags
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {prompt.meta_tags.map((tag) => (
              <span key={tag} style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
