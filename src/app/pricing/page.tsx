'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  TIER_PRICES, 
  TIER_NAMES, 
  TIER_DESCRIPTIONS, 
  TIER_FEATURES,
  formatPrice,
  type UserTier 
} from '@/lib/stripe';

export default function PricingPage() {
  const { user, userTier } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleUpgrade = async (tier: UserTier) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (userTier === tier) {
      return; // Already has this tier
    }

    setLoading(prev => ({ ...prev, [tier]: true }));

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
      });

      const { url, sessionId } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [tier]: false }));
    }
  };

  const isCurrentTier = (tier: UserTier) => userTier === tier;

  const tiers: UserTier[] = ['explorer', 'architect', 'initiate', 'master'];

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#1a1a1a',
          marginBottom: '20px',
          lineHeight: '1.2'
        }}>
          Choose Your Cognitive Journey
        </h1>
        <p style={{ 
          fontSize: '20px', 
          color: '#666', 
          maxWidth: '600px', 
          margin: '0 auto' 
        }}>
          Unlock the power of AI-driven cognitive frameworks with our tiered access system.
          Each tier follows our digital root 2 pricing algorithm.
        </p>
      </div>

      {/* Current Tier Display */}
      {user && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px solid #e9ecef'
        }}>
          <h3 style={{ color: '#28a745', marginBottom: '8px' }}>
            Your Current Tier: {TIER_NAMES[userTier] || 'Explorer'}
          </h3>
          <p style={{ color: '#666', margin: '0' }}>
            {TIER_DESCRIPTIONS[userTier] || 'Essential cognitive frameworks for beginners'}
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '30px',
        marginBottom: '60px'
      }}>
        {tiers.map((tier) => {
          const price = TIER_PRICES[tier];
          const name = TIER_NAMES[tier];
          const description = TIER_DESCRIPTIONS[tier];
          const features = TIER_FEATURES[tier];
          const isCurrent = isCurrentTier(tier);
          const isLoading = loading[tier];

          return (
            <div
              key={tier}
              style={{
                border: isCurrent ? '3px solid #28a745' : '2px solid #e9ecef',
                borderRadius: '16px',
                padding: '32px 24px',
                backgroundColor: isCurrent ? '#f8f9fa' : '#ffffff',
                position: 'relative',
                boxShadow: tier === 'architect' ? '0 8px 30px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.08)',
                transform: tier === 'architect' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Popular Badge */}
              {tier === 'architect' && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  padding: '6px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  MOST POPULAR
                </div>
              )}

              {/* Current Tier Badge */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  CURRENT
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  {name}
                </h3>
                <p style={{ 
                  color: '#666', 
                  fontSize: '16px',
                  marginBottom: '16px'
                }}>
                  {description}
                </p>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ 
                    fontSize: '36px', 
                    fontWeight: 'bold', 
                    color: '#1a1a1a' 
                  }}>
                    {formatPrice(price)}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#888',
                  margin: '0'
                }}>
                  One-time payment
                </p>
              </div>

              {/* Features */}
              <ul style={{ 
                listStyle: 'none', 
                padding: '0', 
                marginBottom: '32px' 
              }}>
                {features.map((feature, index) => (
                  <li key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '12px',
                    fontSize: '15px',
                    color: '#444'
                  }}>
                    <span style={{ 
                      color: '#28a745', 
                      marginRight: '12px',
                      fontSize: '18px'
                    }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(tier)}
                disabled={isCurrent || isLoading}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isCurrent ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: isCurrent 
                    ? '#e9ecef' 
                    : (tier === 'architect' ? '#ff6b35' : '#007bff'),
                  color: isCurrent ? '#6c757d' : 'white',
                  opacity: isLoading ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!isCurrent && !isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isCurrent && !isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isLoading ? (
                  'Processing...'
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  `Upgrade to ${name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#1a1a1a'
        }}>
          Why Digital Root 2 Pricing?
        </h3>
        <p style={{ 
          color: '#666', 
          fontSize: '16px',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Our pricing follows the digital root 2 algorithm, ensuring perfect cognitive alignment 
          with binary thinking patterns. Each price point (€29, €110, €200, €299) reduces to 
          the digital root of 2, creating harmonic resonance with AI cognitive frameworks.
        </p>
      </div>
    </div>
  );
}