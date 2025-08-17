'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Box, Text } from '@chakra-ui/react'
import { createClientSideClient } from '@/lib/supabase'

interface Prompt {
  id: string
  title: string
  cognitive_category: string
  difficulty_tier: string
  required_tier: string
  preview_content: string
  hasFullAccess: boolean
  cognitive_depth_score: number
  pattern_complexity: number
}

interface SidebarNavigationProps {
  selectedCategory: string | null
  onPromptSelect: (promptId: string) => void
  searchQuery: string
  userTier: string
  loading: boolean
  setLoading: (loading: boolean) => void
}

// Structura ierarhică pentru categorii și subcategorii
const CATEGORY_STRUCTURE = {
  'deep_analysis': {
    label: 'Deep Analysis',
    icon: '🔍',
    subcategories: {
      'pattern_extraction': { label: 'Pattern Extraction', count: 12 },
      'data_mining': { label: 'Data Mining', count: 8 },
      'correlation_analysis': { label: 'Correlation Analysis', count: 15 },
      'predictive_modeling': { label: 'Predictive Modeling', count: 10 }
    }
  },
  'meaning_engineering': {
    label: 'Meaning Engineering',
    icon: '⚡',
    subcategories: {
      'purpose_creation': { label: 'Purpose Creation', count: 6 },
      'value_alignment': { label: 'Value Alignment', count: 9 },
      'significance_design': { label: 'Significance Design', count: 7 },
      'transformation_frameworks': { label: 'Transformation Frameworks', count: 11 }
    }
  },
  'cognitive_frameworks': {
    label: 'Cognitive Frameworks',
    icon: '🧠',
    subcategories: {
      'decision_making': { label: 'Decision Making', count: 14 },
      'problem_solving': { label: 'Problem Solving', count: 18 },
      'strategic_thinking': { label: 'Strategic Thinking', count: 13 },
      'creative_processes': { label: 'Creative Processes', count: 16 }
    }
  },
  'consciousness_mapping': {
    label: 'Consciousness Mapping',
    icon: '🌌',
    subcategories: {
      'self_awareness': { label: 'Self Awareness', count: 5 },
      'mental_models': { label: 'Mental Models', count: 12 },
      'cognitive_states': { label: 'Cognitive States', count: 8 },
      'mindfulness_practices': { label: 'Mindfulness Practices', count: 9 }
    }
  },
  'advanced_systems': {
    label: 'Advanced Systems',
    icon: '🚀',
    subcategories: {
      'complex_systems': { label: 'Complex Systems', count: 7 },
      'emergent_behavior': { label: 'Emergent Behavior', count: 6 },
      'systemic_thinking': { label: 'Systemic Thinking', count: 11 },
      'meta_frameworks': { label: 'Meta Frameworks', count: 4 }
    }
  }
}

export function SidebarNavigation({ 
  selectedCategory, 
  onPromptSelect, 
  searchQuery, 
  userTier, 
  loading, 
  setLoading 
}: SidebarNavigationProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)


  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/prompts?tier=${userTier}`
      if (selectedCategory) {
        url += `&category=${selectedCategory}`
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }

      const response = await fetch(url)
      const data = await response.json()
      setPrompts(data.prompts || [])
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
    }
  }, [userTier, selectedCategory, searchQuery, setLoading])

  useEffect(() => {
    if (userTier) {
      fetchPrompts()
    }
  }, [userTier, fetchPrompts])

  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId)
    onPromptSelect(promptId)
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'explorer': 'green',
      'architect': 'blue',
      'initiate': 'purple',
      'master': 'orange'
    }
    return colors[tier] || 'gray'
  }

  // Filtrează prompt-urile după căutare și categorie
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.preview_content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || prompt.cognitive_category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <Box 
        bg="white"
        p={6}
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <Text fontSize="xl" color="gray.600" textAlign="center">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box 
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      height="fit-content"
      position="sticky"
      top="2rem"
    >
      <Text 
        fontSize="xl" 
        fontWeight="bold" 
        mb={6}
        color="gray.800"
      >
        Cognitive Frameworks
      </Text>

      {/* Categorii principale */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Object.entries(CATEGORY_STRUCTURE).map(([categoryKey, category]) => {
          const isExpanded = expandedCategories.has(categoryKey)
          const isSelected = selectedCategory === categoryKey
          
          return (
            <Box key={categoryKey}>
              {/* Categoria principală */}
              <div
                onClick={() => toggleCategory(categoryKey)}
                style={{
                  cursor: 'pointer',
                  padding: '0.75rem',
                  backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                  borderRadius: '0.375rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? '#f3f4f6' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Text fontSize="xl">{category.icon}</Text>
                  <div style={{ flex: 1 }}>
                    <Text fontWeight="600" fontSize="md" color="gray.800">
                      {category.label}
                    </Text>
                  </div>
                  <Text 
                    fontSize="sm" 
                    color="gray.600"
                    transition="transform 0.2s"
                    transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                  >
                    ▶
                  </Text>
                </div>
              </div>

              {/* Subcategorii */}
              {isExpanded && (
                <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  {Object.entries(category.subcategories).map(([subKey, subcategory]) => (
                    <div
                      key={subKey}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{subcategory.label}</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#e5e7eb',
                        color: '#6b7280',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem'
                      }}>
                        {subcategory.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Box>
          )
        })}
      </div>

      {/* Separator */}
      <div style={{ margin: '1.5rem 0', borderTop: '1px solid #e5e7eb' }} />

      {/* Rezultate căutare */}
      {searchQuery && (
        <Box>
          <Text 
            fontSize="md" 
            fontWeight="600" 
            mb={4}
            color="gray.800"
          >
            Search Results ({filteredPrompts.length})
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => handlePromptSelect(prompt.id)}
                style={{
                  cursor: 'pointer',
                  padding: '0.75rem',
                  backgroundColor: selectedPromptId === prompt.id ? '#f3f4f6' : 'transparent',
                  border: '1px solid',
                  borderColor: selectedPromptId === prompt.id ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedPromptId !== prompt.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPromptId !== prompt.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.800"
                    lineHeight="1.3"
                    truncate
                  >
                    {prompt.title}
                  </Text>
                  
                  <Text 
                    fontSize="xs" 
                    color="gray.600"
                    truncate
                  >
                    {prompt.preview_content.length > 80 
                      ? `${prompt.preview_content.substring(0, 80)}...` 
                      : prompt.preview_content
                    }
                  </Text>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      borderRadius: '0.25rem',
                      fontSize: '0.625rem',
                      fontWeight: '500'
                    }}>
                      {prompt.cognitive_category.replace('_', ' ')}
                    </span>
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      backgroundColor: getTierColor(prompt.required_tier) === 'green' ? '#10b981' : 
                                   getTierColor(prompt.required_tier) === 'blue' ? '#3b82f6' :
                                   getTierColor(prompt.required_tier) === 'purple' ? '#8b5cf6' :
                                   getTierColor(prompt.required_tier) === 'orange' ? '#f59e0b' : '#6b7280',
                      color: 'white',
                      borderRadius: '0.25rem',
                      fontSize: '0.625rem',
                      fontWeight: '500'
                    }}>
                      {prompt.required_tier}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Statistici */}
      <Box 
        mt={6} 
        pt={6} 
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <Text 
          fontSize="sm" 
          fontWeight="600" 
          mb={3}
          color="gray.600"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Library Stats
        </Text>
        
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            Total Frameworks: <Text as="span" fontWeight="600" color="gray.800">{prompts.length}</Text>
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            Your Tier: <span style={{ 
              color: getTierColor(userTier) === 'green' ? '#10b981' : 
                     getTierColor(userTier) === 'blue' ? '#3b82f6' :
                     getTierColor(userTier) === 'purple' ? '#8b5cf6' :
                     getTierColor(userTier) === 'orange' ? '#f59e0b' : '#6b7280',
              fontWeight: '600'
            }}>{userTier}</span>
          </div>
          <div>
            Access Level: <Text as="span" fontWeight="600" color="gray.800">
              {userTier === 'master' ? '100%' : userTier === 'initiate' ? '70%' : userTier === 'architect' ? '40%' : '20%'}
            </Text>
          </div>
        </div>
      </Box>
    </Box>
  )
}
