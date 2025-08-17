'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  TIER_PRICES, 
  TIER_NAMES, 
  TIER_DESCRIPTIONS, 
  TIER_FEATURES,
  formatPrice,
  type UserTier 
} from '@/lib/stripe'

export default function PricingPage() {
  const { user, userTier, loading } = useAuth()
  const [selectedTier, setSelectedTier] = useState<UserTier | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleUpgrade = async (tier: UserTier) => {
    if (!user) {
      router.push('/auth')
      return
    }

    if (tier === userTier) {
      return // Already at this tier
    }

    setSelectedTier(tier)
    setCheckoutLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        setError('Failed to create checkout session')
      }
    } catch (err) {
      setError('An error occurred while processing your request')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case 'explorer': return '#10b981'
      case 'architect': return '#3b82f6'
      case 'initiate': return '#8b5cf6'
      case 'master': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const isCurrentTier = (tier: UserTier) => tier === userTier
  const isUpgradeable = (tier: UserTier) => {
    const tierOrder: UserTier[] = ['explorer', 'architect', 'initiate', 'master']
    const currentIndex = tierOrder.indexOf(userTier)
    const targetIndex = tierOrder.indexOf(tier)
    return targetIndex > currentIndex
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#374151',
            marginBottom: '1rem'
          }}>
            Choose Your Cognitive Journey
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Unlock advanced AI frameworks designed for cognitive depth and meaning engineering
          </p>
        </div>

        {/* Pricing Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {(['explorer', 'architect', 'initiate', 'master'] as UserTier[]).map((tier) => (
            <div
              key={tier}
              style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: isCurrentTier(tier) ? `3px solid ${getTierColor(tier)}` : '1px solid #e5e7eb',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Current Tier Badge */}
              {isCurrentTier(tier) && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: getTierColor(tier),
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Current Plan
                </div>
              )}

              {/* Tier Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {TIER_NAMES[tier]}
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#6b7280',
                  marginBottom: '1rem'
                }}>
                  {TIER_DESCRIPTIONS[tier]}
                </p>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: getTierColor(tier)
                }}>
                  {formatPrice(TIER_PRICES[tier])}
                </div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280'
                }}>
                  One-time payment
                </p>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '2rem' }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {TIER_FEATURES[tier].map((feature, index) => (
                    <li
                      key={index}
                      style={{
                        padding: '0.5rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}
                    >
                      <span style={{ 
                        color: getTierColor(tier), 
                        marginRight: '0.5rem',
                        fontSize: '1.25rem'
                      }}>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(tier)}
                disabled={isCurrentTier(tier) || checkoutLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: isCurrentTier(tier) 
                    ? '#9ca3af' 
                    : isUpgradeable(tier) 
                      ? getTierColor(tier)
                      : '#e5e7eb',
                  color: isCurrentTier(tier) || !isUpgradeable(tier) ? '#6b7280' : 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isCurrentTier(tier) || !isUpgradeable(tier) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isCurrentTier(tier) 
                  ? 'Current Plan' 
                  : !isUpgradeable(tier) 
                    ? 'Downgrade Not Available'
                    : checkoutLoading && selectedTier === tier
                      ? 'Processing...'
                      : `Upgrade to ${TIER_NAMES[tier]}`
                }
              </button>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* FAQ Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#374151',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '2rem' 
          }}>
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Can I upgrade my tier later?
              </h3>
              <p style={{ color: '#6b7280' }}>
                Yes! You can upgrade to any higher tier at any time. The new tier will be activated immediately after payment.
              </p>
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                What payment methods do you accept?
              </h3>
              <p style={{ color: '#6b7280' }}>
                We accept all major credit cards, debit cards, and digital wallets through our secure Stripe integration.
              </p>
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Is there a money-back guarantee?
              </h3>
              <p style={{ color: '#6b7280' }}>
                Yes! We offer a 30-day money-back guarantee. If you&apos;re not satisfied, contact us for a full refund.
              </p>
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Do you offer team discounts?
              </h3>
              <p style={{ color: '#6b7280' }}>
                Yes! For teams of 5+ users, we offer special enterprise pricing. Contact us for custom quotes.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#374151',
            marginBottom: '1rem'
          }}>
            Ready to Transform Your Cognitive Capabilities?
          </h2>
          <p style={{ 
            fontSize: '1.125rem', 
            color: '#6b7280',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Join thousands of professionals who are already using AI-Prompt-Templates to unlock their full potential.
          </p>
          <button
            onClick={() => router.push('/library')}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Start Exploring Frameworks
          </button>
        </div>
      </div>
    </div>
  )
}