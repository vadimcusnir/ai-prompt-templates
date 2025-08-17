import React from 'react'
import { formatPrice } from '@/lib/stripe'
import { Prompt, CognitiveCategory, DifficultyTier } from '../types'

interface PromptListProps {
  prompts: Prompt[]
  promptsLoading: boolean
  onEdit: (prompt: Prompt) => void
  onDelete: (promptId: string) => void
  getCategoryColor: (category: CognitiveCategory) => string
  getDifficultyColor: (difficulty: DifficultyTier) => string
}

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  promptsLoading,
  onEdit,
  onDelete,
  getCategoryColor,
  getDifficultyColor
}) => {
  if (promptsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading prompts...
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        No prompts found. Add your first prompt to get started!
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: '#374151',
        marginBottom: '1.5rem'
      }}>
        Existing Prompts ({prompts.length})
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '1rem' 
      }}>
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1rem',
              backgroundColor: '#f9fafb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#374151',
                margin: 0,
                flex: '1'
              }}>
                {prompt.title}
              </h3>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => onEdit(prompt)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                
                <button
                  onClick={() => onDelete(prompt.id)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: getCategoryColor(prompt.cognitive_category),
                color: 'white',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {prompt.cognitive_category.replace('_', ' ')}
              </span>
              
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: getDifficultyColor(prompt.difficulty_tier),
                color: 'white',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {prompt.difficulty_tier}
              </span>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              <span>Depth: {prompt.cognitive_depth_score}/10</span>
              <span style={{ margin: '0 0.5rem' }}>•</span>
              <span>Complexity: {prompt.pattern_complexity}/5</span>
              <span style={{ margin: '0 0.5rem' }}>•</span>
              <span>Price: {formatPrice(prompt.price_cents)}</span>
            </div>

            <p style={{ 
              fontSize: '0.875rem', 
              color: '#374151',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {prompt.preview_content.substring(0, 100)}...
            </p>

            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Created: {new Date(prompt.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PromptList
