import React from 'react'
import { formatPrice } from '../../../../lib/stripe'
import { Prompt, NewPrompt, CognitiveCategory, DifficultyTier } from '../types'

interface PromptFormProps {
  editingPrompt: Prompt | null
  newPrompt: NewPrompt
  setNewPrompt: React.Dispatch<React.SetStateAction<NewPrompt>>
  categories: readonly CognitiveCategory[]
  difficulties: readonly DifficultyTier[]
  formLoading: boolean
  onAdd: (e: React.FormEvent) => Promise<void>
  onUpdate: (e: React.FormEvent) => Promise<void>
  onCancel: () => void
  addMeaningLayer: () => void
  removeMeaningLayer: (index: number) => void
  updateMeaningLayer: (index: number, value: string) => void
  addAntiSurfaceFeature: () => void
  removeAntiSurfaceFeature: (index: number) => void
  updateAntiSurfaceFeature: (index: number, value: string) => void
}

const PromptForm: React.FC<PromptFormProps> = ({
  editingPrompt,
  newPrompt,
  setNewPrompt,
  categories,
  difficulties,
  formLoading,
  onAdd,
  onUpdate,
  onCancel,
  addMeaningLayer,
  removeMeaningLayer,
  updateMeaningLayer,
  addAntiSurfaceFeature,
  removeAntiSurfaceFeature,
  updateAntiSurfaceFeature
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: '#374151',
        marginBottom: '1.5rem'
      }}>
        {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
      </h2>

      <form onSubmit={editingPrompt ? onUpdate : onAdd}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Title
            </label>
            <input
              type="text"
              value={newPrompt.title}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, title: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Price (cents)
            </label>
            <input
              type="number"
              value={newPrompt.price_cents}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, price_cents: parseInt(e.target.value) }))}
              required
              min="100"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Category
            </label>
            <select
              value={newPrompt.cognitive_category}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, cognitive_category: e.target.value as CognitiveCategory }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Difficulty
            </label>
            <select
              value={newPrompt.difficulty_tier}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, difficulty_tier: e.target.value as DifficultyTier }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Cognitive Depth Score (1-10)
            </label>
            <input
              type="number"
              value={newPrompt.cognitive_depth_score}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, cognitive_depth_score: parseInt(e.target.value) }))}
              required
              min="1"
              max="10"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Pattern Complexity (1-5)
            </label>
            <input
              type="number"
              value={newPrompt.pattern_complexity}
              onChange={(e) => setNewPrompt(prev => ({ ...prev, pattern_complexity: parseInt(e.target.value) }))}
              required
              min="1"
              max="5"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Preview Content
          </label>
          <textarea
            value={newPrompt.preview_content}
            onChange={(e) => setNewPrompt(prev => ({ ...prev, preview_content: e.target.value }))}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Meaning Layers */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: '500' }}>Meaning Layers</label>
            <button
              type="button"
              onClick={addMeaningLayer}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              + Add Layer
            </button>
          </div>
          {newPrompt.meaning_layers.map((layer, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={layer}
                onChange={(e) => updateMeaningLayer(index, e.target.value)}
                placeholder="Enter meaning layer"
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              <button
                type="button"
                onClick={() => removeMeaningLayer(index)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Anti-Surface Features */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: '500' }}>Anti-Surface Features</label>
            <button
              type="button"
              onClick={addAntiSurfaceFeature}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              + Add Feature
            </button>
          </div>
          {newPrompt.anti_surface_features.map((feature, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={feature}
                onChange={(e) => updateAntiSurfaceFeature(index, e.target.value)}
                placeholder="Enter anti-surface feature"
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              <button
                type="button"
                onClick={() => removeAntiSurfaceFeature(index)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={formLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: formLoading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: formLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {formLoading ? 'Processing...' : (editingPrompt ? 'Update Prompt' : 'Add Prompt')}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default PromptForm
