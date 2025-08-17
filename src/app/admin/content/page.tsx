'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useLogger } from './hooks/useLogger'
import { useMonitoring } from './hooks/useMonitoring'
import { useSecurity } from './hooks/useSecurity'
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor'
import ErrorBoundary from './components/ErrorBoundary'
import SEOHead from './components/SEOHead'
import { AccessibilityProvider, AccessibilityToolbar } from './components/AccessibilityProvider'

// Lazy loading pentru componentele mari
const PromptForm = lazy(() => import('./components/PromptForm'))
const PromptList = lazy(() => import('./components/PromptList'))
const AdminHeader = lazy(() => import('./components/AdminHeader'))

import { Prompt, NewPrompt, CognitiveCategory, DifficultyTier, CacheState } from './types'

import { usePromptCache } from './hooks/usePromptCache'
import { usePromptsFetch } from './hooks/usePromptsFetch'
import { usePromptForm } from './hooks/usePromptForm'

export default function AdminContentPage() {
  const { user, loading } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const router = useRouter()

  // Cache hook
  const { isCacheValid, updateCache, invalidateCache, getCachedPrompts } = usePromptCache()

  // Fetch hook
  const { loading: fetchLoading, error: fetchError, fetchPrompts, clearError: clearFetchError } = usePromptsFetch(updateCache)

  // Form hook
  const { 
    formLoading, 
    error, 
    success, 
    handleAddPrompt, 
    handleUpdatePrompt, 
    handleDeletePrompt, 
    clearMessages 
  } = usePromptForm(invalidateCache, fetchPrompts)

  // Logger hook
  const logger = useLogger('AdminContentPage')

  // Monitoring hook
  const monitoring = useMonitoring()

  // Security hook
  const security = useSecurity()

  // Performance monitoring hook
  const performanceMonitor = usePerformanceMonitor()

  // Memoized state pentru newPrompt
  const [newPrompt, setNewPrompt] = useState<NewPrompt>(() => ({
    title: '',
    cognitive_category: 'deep_analysis',
    difficulty_tier: 'foundation',
    cognitive_depth_score: 5,
    pattern_complexity: 3,
    price_cents: 2900,
    preview_content: '',
    meaning_layers: [''],
    anti_surface_features: ['']
  }))

  // Memoized categories și difficulties
  const categories = useMemo<readonly CognitiveCategory[]>(() => 
    ['deep_analysis', 'meaning_engineering', 'cognitive_frameworks', 'consciousness_mapping', 'advanced_systems'], 
    []
  )
  
  const difficulties = useMemo<readonly DifficultyTier[]>(() => 
    ['foundation', 'advanced', 'expert', 'architect'], 
    []
  )

  // Wrapper functions pentru form handlers cu security validation
  const handleAddPromptSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Security validation
    const securityValidation = security.validateRequest({
      method: 'POST',
      url: '/api/prompts',
      headers: { 'Content-Type': 'application/json' },
      body: newPrompt,
      csrfToken: security.generateCSRFToken()
    })

    if (!securityValidation.isValid) {
      logger.error('Security validation failed for add prompt', { violations: securityValidation.violations })
      return
    }

    // Input sanitization
    const sanitizedPrompt = {
      ...newPrompt,
      title: security.sanitizeInput(newPrompt.title),
      preview_content: security.sanitizeInput(newPrompt.preview_content),
      meaning_layers: newPrompt.meaning_layers.map(layer => security.sanitizeInput(layer)),
      anti_surface_features: newPrompt.anti_surface_features.map(feature => security.sanitizeInput(feature))
    }

    // Input validation
    const titleValidation = security.validateInput(sanitizedPrompt.title, {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 200
    })

    if (!titleValidation.isValid) {
      logger.error('Input validation failed', { errors: titleValidation.errors })
      return
    }

    const success = await handleAddPrompt(sanitizedPrompt, isCacheValid)
    if (success) {
      setShowAddForm(false)
      resetForm()
      
      // Track successful action
      monitoring.recordEvent('prompt_added', 'content', 'success', 'add_prompt')
      logger.info('Prompt added successfully', { prompt: sanitizedPrompt })
    }
  }, [newPrompt, handleAddPrompt, isCacheValid, security, logger, monitoring])

  const handleUpdatePromptSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrompt) return

    // Security validation
    const securityValidation = security.validateRequest({
      method: 'PUT',
      url: `/api/prompts/${editingPrompt.id}`,
      headers: { 'Content-Type': 'application/json' },
      body: newPrompt,
      csrfToken: security.generateCSRFToken()
    })

    if (!securityValidation.isValid) {
      logger.error('Security validation failed for update prompt', { violations: securityValidation.violations })
      return
    }

    // Input sanitization and validation (same as add)
    const sanitizedPrompt = {
      ...newPrompt,
      title: security.sanitizeInput(newPrompt.title),
      preview_content: security.sanitizeInput(newPrompt.preview_content),
      meaning_layers: newPrompt.meaning_layers.map(layer => security.sanitizeInput(layer)),
      anti_surface_features: newPrompt.anti_surface_features.map(feature => security.sanitizeInput(feature))
    }

    const success = await handleUpdatePrompt(editingPrompt, sanitizedPrompt, isCacheValid)
    if (success) {
      setEditingPrompt(null)
      resetForm()
      
      // Track successful action
      monitoring.recordEvent('prompt_updated', 'content', 'success', 'update_prompt')
      logger.info('Prompt updated successfully', { promptId: editingPrompt.id })
    }
  }, [editingPrompt, newPrompt, handleUpdatePrompt, isCacheValid, security, logger, monitoring])

  const handleDeletePromptWrapper = useCallback(async (promptId: string) => {
    // Security validation
    const securityValidation = security.validateRequest({
      method: 'DELETE',
      url: `/api/prompts/${promptId}`,
      headers: {},
      csrfToken: security.generateCSRFToken()
    })

    if (!securityValidation.isValid) {
      logger.error('Security validation failed for delete prompt', { violations: securityValidation.violations })
      return
    }

    await handleDeletePrompt(promptId, isCacheValid)
    
    // Track successful action
    monitoring.recordEvent('prompt_deleted', 'content', 'success', 'delete_prompt')
    logger.info('Prompt deleted successfully', { promptId })
  }, [handleDeletePrompt, isCacheValid, security, logger, monitoring])

  // Memoized utility functions
  const resetForm = useCallback(() => {
    setNewPrompt({
      title: '',
      cognitive_category: 'deep_analysis',
      difficulty_tier: 'foundation',
      cognitive_depth_score: 5,
      pattern_complexity: 3,
      price_cents: 2900,
      preview_content: '',
      meaning_layers: [''],
      anti_surface_features: ['']
    })
  }, [])

  const startEdit = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt)
    setNewPrompt({
      title: prompt.title,
      cognitive_category: prompt.cognitive_category,
      difficulty_tier: prompt.difficulty_tier,
      cognitive_depth_score: prompt.cognitive_depth_score,
      pattern_complexity: prompt.pattern_complexity,
      price_cents: prompt.price_cents,
      preview_content: prompt.preview_content,
      meaning_layers: [...prompt.meaning_layers],
      anti_surface_features: [...prompt.anti_surface_features]
    })
    
    // Track user interaction
    monitoring.trackUserInteraction('edit_button', 'click', { promptId: prompt.id })
  }, [monitoring])

  const cancelEdit = useCallback(() => {
    setEditingPrompt(null)
    resetForm()
  }, [resetForm])

  // Memoized array manipulation functions
  const addMeaningLayer = useCallback(() => {
    setNewPrompt(prev => ({
      ...prev,
      meaning_layers: [...prev.meaning_layers, '']
    }))
  }, [])

  const removeMeaningLayer = useCallback((index: number) => {
    setNewPrompt(prev => ({
      ...prev,
      meaning_layers: prev.meaning_layers.filter((_, i) => i !== index)
    }))
  }, [])

  const updateMeaningLayer = useCallback((index: number, value: string) => {
    setNewPrompt(prev => ({
      ...prev,
      meaning_layers: prev.meaning_layers.map((layer, i) => i === index ? value : layer)
    }))
  }, [])

  const addAntiSurfaceFeature = useCallback(() => {
    setNewPrompt(prev => ({
      ...prev,
      anti_surface_features: [...prev.anti_surface_features, '']
    }))
  }, [])

  const removeAntiSurfaceFeature = useCallback((index: number) => {
    setNewPrompt(prev => ({
      ...prev,
      anti_surface_features: prev.anti_surface_features.filter((_, i) => i !== index)
    }))
  }, [])

  const updateAntiSurfaceFeature = useCallback((index: number, value: string) => {
    setNewPrompt(prev => ({
      ...prev,
      anti_surface_features: prev.anti_surface_features.map((feature, i) => i === index ? value : feature)
    }))
  }, [])

  // Memoized color functions
  const getCategoryColor = useCallback((category: CognitiveCategory): string => {
    const colorMap: Record<CognitiveCategory, string> = {
      deep_analysis: '#8b5cf6',
      meaning_engineering: '#3b82f6',
      cognitive_frameworks: '#10b981',
      consciousness_mapping: '#f59e0b',
      advanced_systems: '#ef4444'
    }
    return colorMap[category] || '#6b7280'
  }, [])

  const getDifficultyColor = useCallback((difficulty: DifficultyTier): string => {
    const colorMap: Record<DifficultyTier, string> = {
      foundation: '#10b981',
      advanced: '#3b82f6',
      expert: '#8b5cf6',
      architect: '#f59e0b'
    }
    return colorMap[difficulty] || '#6b7280'
  }, [])

  // Effect pentru fetch-ul inițial
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user && !isCacheValid()) {
      const endTimer = performanceMonitor.startFetchTimer()
      fetchPrompts(isCacheValid).finally(endTimer)
    }
  }, [user, loading, router, isCacheValid, fetchPrompts, performanceMonitor])

  // Performance monitoring
  useEffect(() => {
    monitoring.trackPageView('/admin/content', { section: 'content_management' })
  }, [monitoring])

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading admin panel...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  const prompts = getCachedPrompts()

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <SEOHead
          title="Content Management"
          description="Manage cognitive frameworks, AI prompts, and content with advanced security and monitoring"
          keywords={['AI prompts', 'cognitive frameworks', 'content management', 'admin panel']}
          ogType="website"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Content Management",
            "description": "Admin panel for managing AI prompts and cognitive frameworks",
            "url": "https://aiprompttemplates.com/admin/content"
          }}
        />
        
        <ProtectedRoute requiredTier="master">
          <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#f8fafc',
            padding: '2rem'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {/* Header cu lazy loading */}
              <Suspense fallback={<div>Loading header...</div>}>
                <AdminHeader 
                  onAddNew={() => setShowAddForm(true)}
                  onBackToDashboard={() => router.push('/dashboard')}
                />
              </Suspense>

              {/* Messages */}
              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '2rem'
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '2rem'
                }}>
                  {success}
                </div>
              )}

              {/* Add/Edit Form cu lazy loading */}
              {(showAddForm || editingPrompt) && (
                <Suspense fallback={<div>Loading form...</div>}>
                  <PromptForm
                    editingPrompt={editingPrompt}
                    newPrompt={newPrompt}
                    setNewPrompt={setNewPrompt}
                    categories={categories}
                    difficulties={difficulties}
                    formLoading={formLoading}
                    onAdd={handleAddPromptSubmit}
                    onUpdate={handleUpdatePromptSubmit}
                    onCancel={editingPrompt ? cancelEdit : () => setShowAddForm(false)}
                    addMeaningLayer={addMeaningLayer}
                    removeMeaningLayer={removeMeaningLayer}
                    updateMeaningLayer={updateMeaningLayer}
                    addAntiSurfaceFeature={addAntiSurfaceFeature}
                    removeAntiSurfaceFeature={removeAntiSurfaceFeature}
                    updateAntiSurfaceFeature={updateAntiSurfaceFeature}
                  />
                </Suspense>
              )}

              {/* Prompts List cu lazy loading */}
              <Suspense fallback={<div>Loading prompts...</div>}>
                <PromptList
                  prompts={prompts}
                  promptsLoading={fetchLoading}
                  onEdit={startEdit}
                  onDelete={handleDeletePromptWrapper}
                  getCategoryColor={getCategoryColor}
                  getDifficultyColor={getDifficultyColor}
                />
              </Suspense>
            </div>
          </div>
          
          {/* Accessibility Toolbar */}
          <AccessibilityToolbar />
        </ProtectedRoute>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}