'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

interface TableOfContentsProps {
  promptId: string | null
}

interface TocItem {
  id: string
  title: string
  level: number
}

export function TableOfContents({ promptId }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    if (promptId) {
      // Extract headings from the content to create TOC
      // This is a simplified version - in production you'd parse the actual content
      setTocItems([
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'context', title: 'Context de utilizare', level: 2 },
        { id: 'inputs', title: 'Inputuri obligatorii', level: 2 },
        { id: 'protocol', title: 'Protocol', level: 2 },
        { id: 'antipatterns', title: 'Antipatterns', level: 2 },
        { id: 'test', title: 'Test Rapid', level: 2 },
        { id: 'extensions', title: 'Extensii', level: 2 }
      ])
    } else {
      setTocItems([])
    }
  }, [promptId])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(sectionId)
    }
  }

  if (!promptId) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Table of Contents
        </h3>
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
            Select a framework
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            to view the table of contents
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '1.5rem', 
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      height: 'fit-content',
      position: 'sticky',
      top: '2rem'
    }}>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem',
        color: '#1f2937'
      }}>
        Table of Contents
      </h3>

      {tocItems.length > 0 ? (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              style={{
                textAlign: 'left',
                padding: '0.5rem 0.75rem',
                backgroundColor: activeSection === item.id ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: activeSection === item.id ? '#1f2937' : '#6b7280',
                fontWeight: activeSection === item.id ? '500' : '400',
                transition: 'all 0.2s',
                paddingLeft: `${(item.level - 1) * 1.5 + 0.75}rem`
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.color = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                }
              }}
            >
              {item.title}
            </button>
          ))}
        </nav>
      ) : (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem' }}>
            Loading table of contents...
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '2rem', 
        paddingTop: '1.5rem', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Quick Actions
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            📖 View Full Content
          </button>
          
          <button style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            💾 Download PDF
          </button>
          
          <button style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
          >
            🔗 Share Framework
          </button>
        </div>
      </div>

      {/* Framework Info */}
      <div style={{ 
        marginTop: '2rem', 
        paddingTop: '1.5rem', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Framework Info
        </h4>
        
        <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Category:</strong> Deep Analysis
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Difficulty:</strong> Advanced
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Required Tier:</strong> Architect
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Last Updated:</strong> Today
          </div>
          <div>
            <strong>Version:</strong> 1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}
