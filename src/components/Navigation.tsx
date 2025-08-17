'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const { user, userTier, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1.5rem'
      }}>
        {/* Logo/Brand */}
        <Link 
          href="/"
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1a1a1a',
            textDecoration: 'none'
          }}
        >
          AI-Prompt-Templates
        </Link>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <Link 
            href="/library"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
          >
            Library
          </Link>

          <Link 
            href="/pricing"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
          >
            Pricing
          </Link>

          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* User Tier Badge */}
              {userTier && (
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: userTier === 'master' ? '#f59e0b' : 
                                  userTier === 'initiate' ? '#8b5cf6' :
                                  userTier === 'architect' ? '#3b82f6' : '#10b981',
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {userTier}
                </span>
              )}

              <Link 
                href="/dashboard"
                style={{
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
                onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
              >
                Dashboard
              </Link>

              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Link 
                href="/auth"
                style={{
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
                onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
              >
                Sign In
              </Link>

              <Link 
                href="/auth"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}