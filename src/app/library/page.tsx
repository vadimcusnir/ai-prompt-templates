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
  cognitive_depth_score: number
  pattern_complexity: number
  price_cents: number
  preview_content: string
  meaning_layers: string[]
  anti_surface_features: string[]
  view_count: number
  rating_avg: number
}

export default function LibraryPage() {
  const { user, userTier, loading } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const router = useRouter()

  const fetchPrompts = useCallback(async () => {
    try {
      const response = await fetch(`/api/prompts?tier=${userTier}`)
      const data = await response.json()
      setPrompts(data.prompts || [])
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setPromptsLoading(false)
    }
  }, [userTier])

  const filterPrompts = useCallback(() => {
    let filtered = prompts

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.cognitive_category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(prompt => prompt.difficulty_tier === selectedDifficulty)
    }

    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.preview_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.meaning_layers.some(layer => layer.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredPrompts(filtered)
  }, [prompts, selectedCategory, selectedDifficulty, searchQuery])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user) {
      fetchPrompts()
    }
  }, [user, loading, router, fetchPrompts])

  useEffect(() => {
    if (prompts.length > 0) {
      filterPrompts()
    }
  }, [prompts, filterPrompts])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'deep_analysis': return '#8b5cf6'
      case 'meaning_engineering': return '#3b82f6'
      case 'cognitive_frameworks': return '#10b981'
      case 'consciousness_mapping': return '#f59e0b'
      case 'advanced_systems': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'foundation': return '#10b981'
      case 'advanced': return '#3b82f6'
      case 'expert': return '#8b5cf6'
      case 'architect': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getAccessLevel = (prompt: Prompt) => {
    const tierOrder = ['explorer', 'architect', 'initiate', 'master']
    const userTierIndex = tierOrder.indexOf(userTier)
    
    if (userTier === 'explorer') return 0.2
    if (userTier === 'architect') return 0.4
    if (userTier === 'initiate') return 0.7
    if (userTier === 'master') return 1.0
    
    return 0.2
  }

  const getPreviewContent = (prompt: Prompt) => {
    const accessLevel = getAccessLevel(prompt)
    const words = prompt.preview_content.split(' ')
    const visibleWords = Math.floor(words.length * accessLevel)
    return words.slice(0, visibleWords).join(' ')
  }

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
  }

  const handleCloseModal = () => {
    setSelectedPrompt(null)
  }

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading your cognitive library...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  const categories = ['all', 'deep_analysis', 'meaning_engineering', 'cognitive_frameworks', 'consciousness_mapping', 'advanced_systems']
  const difficulties = ['all', 'foundation', 'advanced', 'expert', 'architect']

  return (
    <ProtectedRoute>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                🧠 Cognitive Library
              </h1>
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                Access {filteredPrompts.length} cognitive frameworks based on your {userTier} tier
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: getCategoryColor(userTier),
                color: 'white',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {userTier} Tier
              </div>
              
              <button
                onClick={handleUpgrade}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                Upgrade Tier
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: '1', minWidth: '300px' }}>
                <input
                  type="text"
                  placeholder="Search frameworks by title, content, or meaning layers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  minWidth: '150px'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.replace('_', ' ')}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  minWidth: '150px'
                }}
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompts Grid */}
          {promptsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div>Loading cognitive frameworks...</div>
            </div>
          ) : filteredPrompts.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handlePromptClick(prompt)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid #e5e7eb'
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
                  {/* Header */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      color: '#374151', 
                      marginBottom: '0.5rem',
                      lineHeight: '1.3'
                    }}>
                      {prompt.title}
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: getCategoryColor(prompt.cognitive_category),
                        color: 'white',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {prompt.cognitive_category.replace('_', ' ')}
                      </span>
                      
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: getDifficultyColor(prompt.difficulty_tier),
                        color: 'white',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {prompt.difficulty_tier}
                      </span>
                    </div>
                  </div>

                  {/* Cognitive Metrics */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Depth: </span>
                      <span style={{ fontWeight: '600', color: '#8b5cf6' }}>
                        {prompt.cognitive_depth_score}/10
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Complexity: </span>
                      <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                        {prompt.pattern_complexity}/5
                      </span>
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {getPreviewContent(prompt)}
                      {getAccessLevel(prompt) < 1 && (
                        <span style={{ color: '#8b5cf6', fontWeight: '500' }}>
                          ... (upgrade to see more)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Meaning Layers Preview */}
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      Meaning Layers:
                    </p>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {prompt.meaning_layers.slice(0, 3).map((layer, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          {layer.replace('_', ' ')}
                        </span>
                      ))}
                      {prompt.meaning_layers.length > 3 && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          +{prompt.meaning_layers.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '1rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      <span>👁️ {prompt.view_count} views</span>
                      <span style={{ margin: '0 0.5rem' }}>•</span>
                      <span>⭐ {prompt.rating_avg.toFixed(1)}</span>
                    </div>
                    
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#8b5cf6' 
                    }}>
                      {/* Removed formatPrice as it's not imported */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '1rem' }}>
                No frameworks found
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedDifficulty('all')
                  setSearchQuery('')
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Prompt Detail Modal */}
          {selectedPrompt && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
            onClick={handleCloseModal}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  maxWidth: '800px',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>

                {/* Content */}
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  {selectedPrompt.title}
                </h2>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: getCategoryColor(selectedPrompt.cognitive_category),
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {selectedPrompt.cognitive_category.replace('_', ' ')}
                  </span>
                  
                  <span style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: getDifficultyColor(selectedPrompt.difficulty_tier),
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {selectedPrompt.difficulty_tier}
                  </span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ 
                    color: '#374151', 
                    fontSize: '1.125rem',
                    lineHeight: '1.6'
                  }}>
                    {getAccessLevel(selectedPrompt) >= 1 
                      ? selectedPrompt.preview_content
                      : getPreviewContent(selectedPrompt) + '... (upgrade to see full content)'
                    }
                  </p>
                </div>

                {getAccessLevel(selectedPrompt) >= 1 && (
                  <>
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Meaning Layers
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {selectedPrompt.meaning_layers.map((layer, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                          >
                            {layer.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Anti-Surface Features
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {selectedPrompt.anti_surface_features.map((feature, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                          >
                            {feature.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '1.5rem'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <span>👁️ {selectedPrompt.view_count} views</span>
                    <span style={{ margin: '0 0.5rem' }}>•</span>
                    <span>⭐ {selectedPrompt.rating_avg.toFixed(1)} rating</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {getAccessLevel(selectedPrompt) < 1 && (
                      <button
                        onClick={handleUpgrade}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Upgrade to Access Full Content
                      </button>
                    )}
                    
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      color: '#8b5cf6' 
                    }}>
                      {/* Removed formatPrice as it's not imported */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
