'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientSideClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { logger, logError } from '@/lib/logger'

import { Neuron, NeuronFilters, NeuronSort } from './types'



interface UseNeuronsReturn {
  neurons: Neuron[]
  loading: boolean
  error: string | null
  filters: NeuronFilters
  sort: NeuronSort
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  setFilters: (filters: Partial<NeuronFilters>) => void
  setSort: (sort: Partial<NeuronSort>) => void
  setPage: (page: number) => void
  refresh: () => Promise<void>
  createNeuron: (neuron: Omit<Neuron, 'id' | 'created_at' | 'updated_at' | 'author_id'>) => Promise<{ success: boolean; error?: string }>
  updateNeuron: (id: string, updates: Partial<Neuron>) => Promise<{ success: boolean; error?: string }>
  deleteNeuron: (id: string) => Promise<{ success: boolean; error?: string }>
  toggleFavorite: (id: string) => Promise<{ success: boolean; error?: string }>
  rateNeuron: (id: string, rating: number) => Promise<{ success: boolean; error?: string }>
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEFAULT_LIMIT = 20

export function useNeurons(): UseNeuronsReturn {
  const { user, userTier } = useAuth()
  const supabase = createClientSideClient()
  
  const [neurons, setNeurons] = useState<Neuron[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<NeuronFilters>({})
  const [sort, setSortState] = useState<NeuronSort>({ field: 'created_at', direction: 'desc' })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    hasMore: true
  })
  
  // Cache management
  const [cache, setCache] = useState<Map<string, { data: Neuron[]; timestamp: number; total: number }>>(new Map())
  
  const cacheKey = useMemo(() => {
    return JSON.stringify({ filters, sort, pagination: { page: pagination.page, limit: pagination.limit } })
  }, [filters, sort, pagination.page, pagination.limit])
  
  const fetchNeurons = useCallback(async (useCache = true) => {
    if (useCache) {
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setNeurons(cached.data)
        setPagination(prev => ({ ...prev, total: cached.total, hasMore: cached.total > prev.page * prev.limit }))
        return
      }
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('neurons')
        .select('*', { count: 'exact' })
      
      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }
      if (filters.price_range) {
        query = query.gte('price_cents', filters.price_range[0]).lte('price_cents', filters.price_range[1])
      }
      if (filters.required_tier) {
        query = query.eq('required_tier', filters.required_tier)
      }
      if (filters.author_id) {
        query = query.eq('author_id', filters.author_id)
      }
      
      // Apply access level filtering based on user tier
      if (userTier === 'free') {
        query = query.eq('required_tier', 'free')
      } else if (userTier === 'architect') {
        query = query.in('required_tier', ['free', 'architect'])
      } else if (userTier === 'initiate') {
        query = query.in('required_tier', ['free', 'architect', 'initiate'])
      }
      // Elite users can access everything
      
      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
      
      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit
      query = query.range(offset, offset + pagination.limit - 1)
      
      const { data, error: fetchError, count } = await query
      
      if (fetchError) {
        throw fetchError
      }
      
      const neuronsData = data || []
      setNeurons(neuronsData)
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        hasMore: (count || 0) > prev.page * prev.limit
      }))
      
      // Update cache
      setCache(prev => new Map(prev.set(cacheKey, {
        data: neuronsData,
        timestamp: Date.now(),
        total: count || 0
      })))
      
      logger.info('Neurons fetched successfully', {
        count: neuronsData.length,
        total: count,
        filters,
        sort,
        page: pagination.page
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch neurons'
      setError(errorMessage)
      logError('Error fetching neurons', { error: errorMessage, filters, sort, page: pagination.page })
    } finally {
      setLoading(false)
    }
  }, [supabase, filters, sort, pagination.page, pagination.limit, cacheKey, cache, userTier])
  
  useEffect(() => {
    fetchNeurons()
  }, [fetchNeurons])
  
  const setFilters = useCallback((newFilters: Partial<NeuronFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])
  
  const setSort = useCallback((newSort: Partial<NeuronSort>) => {
    setSortState(prev => ({ ...prev, ...newSort }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])
  
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])
  
  const refresh = useCallback(async () => {
    await fetchNeurons(false) // Skip cache
  }, [fetchNeurons])
  
  const createNeuron = useCallback(async (neuronData: Omit<Neuron, 'id' | 'created_at' | 'updated_at' | 'author_id'>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    try {
      const { data, error } = await supabase
        .from('neurons')
        .insert([{
          ...neuronData,
          author_id: user.id
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // Optimistic update
      setNeurons(prev => [data, ...prev])
      
      // Clear cache to force refresh
      setCache(new Map())
      
      logger.info('Neuron created successfully', { neuronId: data.id, authorId: user.id })
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create neuron'
      logError('Error creating neuron', { error: errorMessage, neuronData, userId: user.id })
      return { success: false, error: errorMessage }
    }
  }, [user, supabase])
  
  const updateNeuron = useCallback(async (id: string, updates: Partial<Neuron>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    try {
      const { data, error } = await supabase
        .from('neurons')
        .update(updates)
        .eq('id', id)
        .eq('author_id', user.id) // Ensure user owns the neuron
        .select()
        .single()
      
      if (error) throw error
      
      // Optimistic update
      setNeurons(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
      
      // Clear cache to force refresh
      setCache(new Map())
      
      logger.info('Neuron updated successfully', { neuronId: id, userId: user.id })
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update neuron'
      logError('Error updating neuron', { error: errorMessage, neuronId: id, updates, userId: user.id })
      return { success: false, error: errorMessage }
    }
  }, [user, supabase])
  
  const deleteNeuron = useCallback(async (id: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    try {
      // Soft-delete: marchează ca nepublicat în loc să ștergi
      const { error } = await supabase
        .from('neurons')
        .update({ 
          published: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('author_id', user.id) // Ensure user owns the neuron
      
      if (error) throw error
      
      // Optimistic update - marchează ca nepublicat local
      setNeurons(prev => prev.map(n => 
        n.id === id ? { ...n, published: false } : n
      ))
      
      // Clear cache to force refresh
      setCache(new Map())
      
      logger.info('Neuron soft-deleted successfully (marked as unpublished)', { neuronId: id, userId: user.id })
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to soft-delete neuron'
      logError('Error soft-deleting neuron', { error: errorMessage, neuronId: id, userId: user.id })
      return { success: false, error: errorMessage }
    }
  }, [user, supabase])
  
  const toggleFavorite = useCallback(async (id: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('neuron_id', id)
        .single()
      
      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, neuron_id: id }])
        
        if (error) throw error
      }
      
      logger.info('Favorite toggled successfully', { neuronId: id, userId: user.id, action: existing ? 'removed' : 'added' })
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite'
      logError('Error toggling favorite', { error: errorMessage, neuronId: id, userId: user.id })
      return { success: false, error: errorMessage }
    }
  }, [user, supabase])
  
  const rateNeuron = useCallback(async (id: string, rating: number) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' }
    }
    
    try {
      // Upsert rating
      const { error } = await supabase
        .from('neuron_ratings')
        .upsert([{ user_id: user.id, neuron_id: id, rating }], {
          onConflict: 'user_id,neuron_id'
        })
      
      if (error) throw error
      
      // Refresh to get updated average rating
      await refresh()
      
      logger.info('Neuron rated successfully', { neuronId: id, userId: user.id, rating })
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rate neuron'
      logError('Error rating neuron', { error: errorMessage, neuronId: id, userId: user.id, rating })
      return { success: false, error: errorMessage }
    }
  }, [user, supabase, refresh])
  
  return {
    neurons,
    loading,
    error,
    filters,
    sort,
    pagination,
    setFilters,
    setSort,
    setPage,
    refresh,
    createNeuron,
    updateNeuron,
    deleteNeuron,
    toggleFavorite,
    rateNeuron
  }
}
