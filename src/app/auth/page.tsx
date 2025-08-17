'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem'
          }}>
            🧠 AI-Prompt-Templates
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Access advanced cognitive frameworks
          </p>
        </div>

        {/* Form */}
        {mode === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onToggleMode={() => setMode('register')}
          />
        ) : (
          <RegisterForm 
            onToggleMode={() => setMode('login')}
          />
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}