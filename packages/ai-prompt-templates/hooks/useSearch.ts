'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from './useDebounce'
import { logger, logInfo } from '@/lib/logger'

export interface SearchFilters {
  query: string
  category: string[]
  difficulty: string[]
  tags: string[]
  priceRange: [number, number]
  accessLevel: string[]
  author: string
  dateRange: [Date | null, Date | null]
}

export interface SearchResult<T> {
  data: T[]
  total: number
  page: number
  hasMore: boolean
  facets: {
    categories: { value: string; count: number }[]
    difficulties: { value: string; count: number }[]
    tags: { value: string; count: number }[]
    priceRanges: { min: number; max: number; count: number }[]
  }
}

export interface UseSearchOptions<T> {
  initialFilters?: Partial<SearchFilters>
  debounceMs?: number
  pageSize?: number
  enableFacets?: boolean
  onSearch?: (filters: SearchFilters) => void
  onResult?: (result: SearchResult<T>) => void
}

export function useSearch<T>(options: UseSearchOptions<T> = {}) {
  const {
    initialFilters = {},
    debounceMs = 300,
    pageSize = 20,
    enableFacets = true,
    onSearch,
    onResult
  } = options

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: [],
    difficulty: [],
    tags: [],
    priceRange: [0, 1000],
    accessLevel: [],
    author: '',
    dateRange: [null, null],
    ...initialFilters
  })

  const [results, setResults] = useState<SearchResult<T>>({
    data: [],
    total: 0,
    page: 1,
    hasMore: false,
    facets: {
      categories: [],
      difficulties: [],
      tags: [],
      priceRanges: []
    }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search query
  const debouncedQuery = useDebounce(filters.query, debounceMs)

  // Memoized search key for caching
  const searchKey = useMemo(() => {
    return JSON.stringify({
      query: debouncedQuery,
      category: filters.category,
      difficulty: filters.difficulty,
      tags: filters.tags,
      priceRange: filters.priceRange,
      accessLevel: filters.accessLevel,
      author: filters.author,
      dateRange: filters.dateRange,
      page: results.page
    })
  }, [debouncedQuery, filters, results.page])

  // Search function
  const performSearch = useCallback(async (searchFilters: SearchFilters, page = 1) => {
    setLoading(true)
    setError(null)

    try {
      // Track search analytics
      logInfo('Search performed', {
        query: searchFilters.query,
        filters: searchFilters,
        page,
        timestamp: new Date().toISOString()
      })

      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(searchFilters)
      }

      // Simulate API call - replace with actual search implementation
      const mockResults: SearchResult<T> = {
        data: [] as T[],
        total: 0,
        page,
        hasMore: false,
        facets: {
          categories: [],
          difficulties: [],
          tags: [],
          priceRanges: []
        }
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 300))

      setResults(mockResults)

      // Call onResult callback if provided
      if (onResult) {
        onResult(mockResults)
      }

      logger.info('Search completed successfully', {
        query: searchFilters.query,
        filters: searchFilters,
        resultsCount: mockResults.total,
        page
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      logger.error('Search failed', { error: errorMessage, filters: searchFilters })
    } finally {
      setLoading(false)
    }
  }, [onSearch, onResult])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setResults(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      query: '',
      category: [],
      difficulty: [],
      tags: [],
      priceRange: [0, 1000],
      accessLevel: [],
      author: '',
      dateRange: [null, null],
      ...initialFilters
    })
    setResults(prev => ({ ...prev, page: 1 }))
  }, [initialFilters])

  // Load more results
  const loadMore = useCallback(() => {
    if (results.hasMore && !loading) {
      setResults(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }, [results.hasMore, loading])

  // Clear search
  const clearSearch = useCallback(() => {
    setFilters({
      query: '',
      category: [],
      difficulty: [],
      tags: [],
      priceRange: [0, 1000],
      accessLevel: [],
      author: '',
      dateRange: [null, null]
    })
    setResults({
      data: [],
      total: 0,
      page: 1,
      hasMore: false,
      facets: {
        categories: [],
        difficulties: [],
        tags: [],
        priceRanges: []
      }
    })
  }, [])

  // Perform search when filters change
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      performSearch(filters, 1)
    }
  }, [debouncedQuery, performSearch, filters])

  // Perform search when page changes
  useEffect(() => {
    if (results.page > 1) {
      performSearch(filters, results.page)
    }
  }, [results.page, performSearch, filters])

  return {
    // State
    filters,
    results,
    loading,
    error,
    
    // Actions
    updateFilters,
    resetFilters,
    clearSearch,
    loadMore,
    performSearch: () => performSearch(filters, 1),
    
    // Computed
    hasResults: results.total > 0,
    isEmpty: !loading && results.total === 0,
    isFirstPage: results.page === 1,
    canLoadMore: results.hasMore && !loading
  }
}
