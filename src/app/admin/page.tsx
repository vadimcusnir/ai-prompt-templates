'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Prompt {
  id: string
  title: string
  cognitive_category: string
  difficulty_tier: string
  required_tier: string
  base_price_cents: number
  quality_score: number
  is_published: boolean
  created_at: string
}

export default function AdminDashboard() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userTier } = useAuth()
  const router = useRouter()
  


  const fetchPrompts = useCallback(async () => {
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setPrompts(data.prompts || [])
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchPrompts()
    }
  }, [user, fetchPrompts])

  const togglePublishStatus = async (promptId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        }),
      })

      if (response.ok) {
        fetchPrompts() // Refresh the list
      } else {
        console.error('Error updating prompt')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPrompts() // Refresh the list
      } else {
        console.error('Error deleting prompt')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (!user || userTier !== 'master') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You need Master tier access to view this page.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Cognitive Frameworks Management</h1>
        <button 
          onClick={() => router.push('/admin/create')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Create New Framework
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Title</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Category</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Tier</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Price</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Quality Score</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{prompt.title}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {prompt.cognitive_category}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {prompt.required_tier}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                  €{(prompt.base_price_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                  {prompt.quality_score}/10
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: prompt.is_published ? '#10b981' : '#f59e0b',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {prompt.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <button 
                    onClick={() => togglePublishStatus(prompt.id, prompt.is_published)}
                    style={{
                      padding: '0.5rem 1rem',
                      marginRight: '0.5rem',
                      backgroundColor: prompt.is_published ? '#f59e0b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {prompt.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => router.push(`/admin/edit/${prompt.id}`)}
                    style={{
                      padding: '0.5rem 1rem',
                      marginRight: '0.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deletePrompt(prompt.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {prompts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <h3>No prompts found</h3>
          <p>Create your first cognitive framework to get started.</p>
        </div>
      )}
    </div>
  )
}
