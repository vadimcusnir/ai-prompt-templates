import { useState, useCallback } from 'react'
import { NewPrompt, Prompt } from '../types'
import { logError } from '@/lib/logger'

export const usePromptForm = (
  invalidateCache: () => void,
  fetchPrompts: (isCacheValid: () => boolean) => Promise<void>
) => {
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddPrompt = useCallback(async (newPrompt: NewPrompt, isCacheValid: () => boolean) => {
    setFormLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrompt),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSuccess('Prompt added successfully!')
        invalidateCache()
        await fetchPrompts(isCacheValid)
        return true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while adding the prompt'
      setError(errorMessage)
      logError('Add prompt error', { error: errorMessage, prompt: newPrompt })
    } finally {
      setFormLoading(false)
    }
    return false
  }, [invalidateCache, fetchPrompts])

  const handleUpdatePrompt = useCallback(async (
    editingPrompt: Prompt, 
    newPrompt: NewPrompt, 
    isCacheValid: () => boolean
  ) => {
    setFormLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/prompts/${editingPrompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrompt),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSuccess('Prompt updated successfully!')
        invalidateCache()
        await fetchPrompts(isCacheValid)
        return true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the prompt'
      setError(errorMessage)
      logError('Update prompt error', { error: errorMessage, promptId: editingPrompt.id, prompt: newPrompt })
    } finally {
      setFormLoading(false)
    }
    return false
  }, [invalidateCache, fetchPrompts])

  const handleDeletePrompt = useCallback(async (promptId: string, isCacheValid: () => boolean) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return false

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSuccess('Prompt deleted successfully!')
        invalidateCache()
        await fetchPrompts(isCacheValid)
        return true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the prompt'
      setError(errorMessage)
      logError('Delete prompt error', { error: errorMessage, promptId })
    }
    return false
  }, [invalidateCache, fetchPrompts])

  const clearMessages = useCallback(() => {
    setError('')
    setSuccess('')
  }, [])

  return {
    formLoading,
    error,
    success,
    handleAddPrompt,
    handleUpdatePrompt,
    handleDeletePrompt,
    clearMessages
  }
}
