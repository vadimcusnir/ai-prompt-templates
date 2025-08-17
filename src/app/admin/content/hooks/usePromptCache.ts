import { useState, useCallback } from 'react'
import { Prompt, CacheState } from '../types'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minute

export const usePromptCache = () => {
  const [cache, setCache] = useState<CacheState>({
    prompts: new Map(),
    lastFetch: 0,
    isStale: true
  })

  const isCacheValid = useCallback(() => {
    return !cache.isStale && (Date.now() - cache.lastFetch) < CACHE_DURATION
  }, [cache])

  const updateCache = useCallback((prompts: Prompt[]) => {
    const promptsMap = new Map(prompts.map(p => [p.id, p]))
    setCache({
      prompts: promptsMap,
      lastFetch: Date.now(),
      isStale: false
    })
  }, [])

  const invalidateCache = useCallback(() => {
    setCache(prev => ({ ...prev, isStale: true }))
  }, [])

  const getCachedPrompts = useCallback(() => {
    return Array.from(cache.prompts.values())
  }, [cache])

  const getCachedPrompt = useCallback((id: string) => {
    return cache.prompts.get(id)
  }, [cache])

  const updateCachedPrompt = useCallback((prompt: Prompt) => {
    setCache(prev => ({
      ...prev,
      prompts: new Map(prev.prompts).set(prompt.id, prompt)
    }))
  }, [])

  const removeCachedPrompt = useCallback((id: string) => {
    setCache(prev => {
      const newPrompts = new Map(prev.prompts)
      newPrompts.delete(id)
      return {
        ...prev,
        prompts: newPrompts
      }
    })
  }, [])

  return {
    isCacheValid,
    updateCache,
    invalidateCache,
    getCachedPrompts,
    getCachedPrompt,
    updateCachedPrompt,
    removeCachedPrompt
  }
}
