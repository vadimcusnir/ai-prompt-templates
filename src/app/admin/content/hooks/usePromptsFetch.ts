import { useState, useCallback } from 'react'
import { Prompt } from '../types'
import { logError } from '@/lib/logger'

export const usePromptsFetch = (updateCache: (prompts: Prompt[]) => void) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = useCallback(async (isCacheValid: () => boolean) => {
    if (isCacheValid()) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/prompts', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const prompts = data.prompts || []
      updateCache(prompts)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      logError('Failed to fetch prompts', { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [updateCache])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    fetchPrompts,
    clearError
  }
}
