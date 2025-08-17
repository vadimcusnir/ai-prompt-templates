'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onSuccess?: () => void
  onToggleMode?: () => void
}

export function LoginForm({ onSuccess, onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
    }
    
    setLoading(false)
  }

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '0 auto', 
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem',
        textAlign: 'center',
        color: '#374151'
      }}>
        Sign In to AI-Prompt-Templates
      </h2>
      
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem' 
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem' 
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '500',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {onToggleMode && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Don&apos;t have an account?{' '}
          </span>
          <button
            onClick={onToggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign Up
          </button>
        </div>
      )}
    </div>
  )
}