'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowConsent(true)
    } else {
      const parsedConsent = JSON.parse(consent)
      setAnalyticsEnabled(parsedConsent.analytics || false)
      setMarketingEnabled(parsedConsent.marketing || false)
    }
  }, [])

  const handleAcceptAll = () => {
    const consent = {
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setAnalyticsEnabled(true)
    setMarketingEnabled(true)
    setShowConsent(false)
    
    // Enable analytics and marketing cookies
    enableAnalytics()
    enableMarketing()
  }

  const handleAcceptSelected = () => {
    const consent = {
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setShowConsent(false)
    
    // Enable selected cookies
    if (analyticsEnabled) enableAnalytics()
    if (marketingEnabled) enableMarketing()
  }

  const handleRejectAll = () => {
    const consent = {
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setAnalyticsEnabled(false)
    setMarketingEnabled(false)
    setShowConsent(false)
  }

  const enableAnalytics = () => {
    // Enable Google Analytics or other analytics services
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted'
      })
      logger.info('Analytics cookies enabled')
    } else {
      logger.info('Analytics service not available')
    }
  }

  const enableMarketing = () => {
    // Enable marketing cookies and tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      })
      logger.info('Marketing cookies enabled')
    } else {
      logger.info('Marketing service not available')
    }
  }

  if (!showConsent) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      padding: '1.5rem',
      boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header */}
          <div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              🍪 Cookie Preferences
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              We use cookies to enhance your experience, analyze site traffic, and personalize content. 
              You can choose which types of cookies to allow below.
            </p>
          </div>

          {/* Cookie Options */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Essential Cookies */}
            <div style={{
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  marginRight: '0.5rem'
                }} />
                <strong style={{ fontSize: '0.875rem' }}>Essential Cookies</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                Required for basic site functionality. Cannot be disabled.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div style={{
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="analytics"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="analytics" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Analytics Cookies
                </label>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                Help us understand how visitors interact with our website.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div style={{
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="marketing"
                  checked={marketingEnabled}
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="marketing" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Marketing Cookies
                </label>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                Used to deliver personalized content and advertisements.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleRejectAll}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Reject All
            </button>
            
            <button
              onClick={handleAcceptSelected}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Accept Selected
            </button>
            
            <button
              onClick={handleAcceptAll}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Accept All
            </button>
          </div>

          {/* Privacy Policy Link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
              By continuing to use our site, you agree to our{' '}
              <a 
                href="/privacy" 
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a 
                href="/terms" 
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
