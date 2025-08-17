'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useDebounce } from './useDebounce'
import { useCache } from './useCache'

interface SearchFilters {
  category?: string
  difficulty?: string
  tags?: string[]
  priceRange?: [number, number]
  accessLevel?: string
  authorId?: string
  dateRange?: [Date, Date]
  rating?: number
  usageCount?: number
}

interface SearchOptions {
  fuzzy?: boolean
  includeSynonyms?: boolean
  searchInContent?: boolean
  searchInTags?: boolean
  searchInAuthor?: boolean
  maxResults?: number
  sortBy?: 'relevance' | 'date' | 'rating' | 'usage' | 'price'
  sortOrder?: 'asc' | 'desc'
}

interface SearchResult<T> {
  item: T
  score: number
  highlights: string[]
  matchedFields: string[]
}

interface SearchSuggestion {
  text: string
  type: 'query' | 'category' | 'tag' | 'author'
  count: number
  relevance: number
}

interface SearchState<T> {
  query: string
  filters: SearchFilters
  results: SearchResult<T>[]
  suggestions: SearchSuggestion[]
  loading: boolean
  error: string | null
  totalResults: number
  currentPage: number
  hasMore: boolean
}

interface UseSearchReturn<T> {
  // State
  query: string
  filters: SearchFilters
  results: SearchResult<T>[]
  suggestions: SearchSuggestion[]
  loading: boolean
  error: string | null
  totalResults: number
  currentPage: number
  hasMore: boolean
  
  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  search: (query?: string, filters?: Partial<SearchFilters>) => Promise<void>
  clearSearch: () => void
  loadMore: () => Promise<void>
  getSuggestions: (query: string) => Promise<SearchSuggestion[]>
  
  // Utilities
  highlightText: (text: string, query: string) => string
  getFilteredResults: (results: T[], filters: SearchFilters) => T[]
  exportResults: (format: 'json' | 'csv') => void
}

// Fuzzy search implementation using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}

// Text highlighting with HTML tags
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Search scoring algorithm
function calculateSearchScore<T>(
  item: T,
  query: string,
  options: SearchOptions,
  searchableFields: (keyof T)[]
): { score: number; highlights: string[]; matchedFields: string[] } {
  let score = 0
  const highlights: string[] = []
  const matchedFields: string[] = []
  
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0)
  
  for (const field of searchableFields) {
    const fieldValue = String(item[field] || '')
    const fieldValueLower = fieldValue.toLowerCase()
    
    for (const word of queryWords) {
      if (fieldValueLower.includes(word)) {
        // Exact word match
        score += 10
        
        // Field-specific scoring
        if (field === 'title') score += 5
        if (field === 'tags') score += 3
        if (field === 'content') score += 1
        
        // Add highlight
        const highlighted = highlightText(fieldValue, word)
        if (!highlights.includes(highlighted)) {
          highlights.push(highlighted)
        }
        
        if (!matchedFields.includes(String(field))) {
          matchedFields.push(String(field))
        }
      } else if (options.fuzzy) {
        // Fuzzy matching
        const distance = levenshteinDistance(word, fieldValueLower)
        const maxLength = Math.max(word.length, fieldValueLower.length)
        const similarity = 1 - (distance / maxLength)
        
        if (similarity > 0.7) { // 70% similarity threshold
          score += Math.floor(similarity * 5)
          
          const highlighted = highlightText(fieldValue, word)
          if (!highlights.includes(highlighted)) {
            highlights.push(highlighted)
          }
          
          if (!matchedFields.includes(String(field))) {
            matchedFields.push(String(field))
          }
        }
      }
    }
  }
  
  return { score, highlights, matchedFields }
}

export function useSearch<T>(
  data: T[],
  searchableFields: (keyof T)[],
  options: SearchOptions = {}
): UseSearchReturn<T> {
  const {
    fuzzy = true,
    includeSynonyms = false,
    searchInContent = true,
    searchInTags = true,
    searchInAuthor = true,
    maxResults = 50,
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = options

  const [state, setState] = useState<SearchState<T>>({
    query: '',
    filters: {},
    results: [],
    suggestions: [],
    loading: false,
    error: null,
    totalResults: 0,
    currentPage: 1,
    hasMore: false
  })

  const debouncedQuery = useDebounce(state.query, 300)
  const searchCache = useCache<SearchResult<T>[]>({ ttl: 5 * 60 * 1000, maxSize: 100 })
  const suggestionsCache = useCache<SearchSuggestion[]>({ ttl: 10 * 60 * 1000, maxSize: 50 })
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Generate search suggestions
  const generateSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!query.trim() || query.length < 2) return []

    const cacheKey = `suggestions:${query.toLowerCase()}`
    const cached = suggestionsCache.get(cacheKey)
    if (cached) return cached

    const suggestions: SearchSuggestion[] = []
    const queryLower = query.toLowerCase()

    // Query suggestions
    if (queryLower.length > 2) {
      suggestions.push({
        text: query,
        type: 'query',
        count: 1,
        relevance: 1.0
      })
    }

    // Category suggestions
    const categories = [...new Set(data.map(item => (item as any).category).filter(Boolean))]
    for (const category of categories) {
      if (category.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: category,
          type: 'category',
          count: data.filter(item => (item as any).category === category).length,
          relevance: 0.8
        })
      }
    }

    // Tag suggestions
    const allTags = data.flatMap(item => (item as any).tags || []).filter(Boolean)
    const uniqueTags = [...new Set(allTags)]
    for (const tag of uniqueTags) {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: tag,
          type: 'tag',
          count: allTags.filter(t => t === tag).length,
          relevance: 0.6
        })
      }
    }

    // Author suggestions
    if (searchInAuthor) {
      const authors = [...new Set(data.map(item => (item as any).author_id).filter(Boolean))]
      for (const author of authors) {
        if (author.toLowerCase().includes(queryLower)) {
          suggestions.push({
            text: author,
            type: 'author',
            count: data.filter(item => (item as any).author_id === author).length,
            relevance: 0.4
          })
        }
      }
    }

    // Sort by relevance and count
    suggestions.sort((a, b) => {
      const relevanceScore = b.relevance - a.relevance
      if (relevanceScore !== 0) return relevanceScore
      return b.count - a.count
    })

    const topSuggestions = suggestions.slice(0, 10)
    suggestionsCache.set(cacheKey, topSuggestions)
    
    return topSuggestions
  }, [data, searchInAuthor, suggestionsCache])

  // Perform search
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters,
    page: number = 1
  ): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Check cache first
      const cacheKey = `search:${JSON.stringify({ query, filters, page })}`
      const cached = searchCache.get(cacheKey)
      
      if (cached && !signal.aborted) {
        setState(prev => ({
          ...prev,
          results: cached,
          totalResults: cached.length,
          currentPage: page,
          hasMore: cached.length === maxResults,
          loading: false
        }))
        return
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))

      if (signal.aborted) return

      // Filter data based on search criteria
      let filteredData = [...data]

      // Apply text search
      if (query.trim()) {
        filteredData = filteredData.filter(item => {
          const searchableText = searchableFields
            .map(field => String(item[field] || ''))
            .join(' ')
            .toLowerCase()
          
          return query.toLowerCase().split(/\s+').every(word => 
            searchableText.includes(word)
          )
        })
      }

      // Apply filters
      filteredData = getFilteredResults(filteredData, filters)

      // Calculate search scores and highlights
      const searchResults: SearchResult<T>[] = filteredData.map(item => {
        const { score, highlights, matchedFields } = calculateSearchScore(
          item,
          query,
          options,
          searchableFields
        )
        
        return {
          item,
          score,
          highlights,
          matchedFields
        }
      })

      // Sort results
      searchResults.sort((a, b) => {
        if (sortBy === 'relevance') {
          return sortOrder === 'desc' ? b.score - a.score : a.score - b.score
        }
        
        const aValue = (a.item as any)[sortBy] || 0
        const bValue = (b.item as any)[sortBy] || 0
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1
        }
        return aValue > bValue ? 1 : -1
      })

      // Apply pagination
      const startIndex = (page - 1) * maxResults
      const paginatedResults = searchResults.slice(startIndex, startIndex + maxResults)

      if (signal.aborted) return

      // Cache results
      searchCache.set(cacheKey, paginatedResults)

      setState(prev => ({
        ...prev,
        results: paginatedResults,
        totalResults: searchResults.length,
        currentPage: page,
        hasMore: startIndex + maxResults < searchResults.length,
        loading: false
      }))

    } catch (error) {
      if (!signal.aborted) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Search failed',
          loading: false
        }))
      }
    }
  }, [data, searchableFields, options, maxResults, searchCache])

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (debouncedQuery.trim() || Object.keys(state.filters).length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(debouncedQuery, state.filters, 1)
      }, 100)
    } else {
      setState(prev => ({
        ...prev,
        results: [],
        totalResults: 0,
        currentPage: 1,
        hasMore: false
      }))
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [debouncedQuery, state.filters, performSearch])

  // Set query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query, currentPage: 1 }))
  }, [])

  // Set filters
  const setFilters = useCallback((filters: Partial<SearchFilters>) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters },
      currentPage: 1
    }))
  }, [])

  // Manual search
  const search = useCallback(async (query?: string, filters?: Partial<SearchFilters>) => {
    const searchQuery = query ?? state.query
    const searchFilters = filters ? { ...state.filters, ...filters } : state.filters
    
    await performSearch(searchQuery, searchFilters, 1)
  }, [state.query, state.filters, performSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      filters: {},
      results: [],
      suggestions: [],
      totalResults: 0,
      currentPage: 1,
      hasMore: false
    }))
  }, [])

  // Load more results
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return
    
    await performSearch(state.query, state.filters, state.currentPage + 1)
  }, [state.loading, state.hasMore, state.query, state.filters, state.currentPage, performSearch])

  // Get suggestions
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    return generateSuggestions(query)
  }, [generateSuggestions])

  // Filter results
  const getFilteredResults = useCallback((results: T[], filters: SearchFilters): T[] => {
    return results.filter(item => {
      // Category filter
      if (filters.category && (item as any).category !== filters.category) {
        return false
      }

      // Difficulty filter
      if (filters.difficulty && (item as any).difficulty !== filters.difficulty) {
        return false
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const itemTags = (item as any).tags || []
        if (!filters.tags.some(tag => itemTags.includes(tag))) {
          return false
        }
      }

      // Price range filter
      if (filters.priceRange) {
        const price = (item as any).price || 0
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          return false
        }
      }

      // Access level filter
      if (filters.accessLevel && (item as any).access_level !== filters.accessLevel) {
        return false
      }

      // Author filter
      if (filters.authorId && (item as any).author_id !== filters.authorId) {
        return false
      }

      // Date range filter
      if (filters.dateRange) {
        const itemDate = new Date((item as any).created_at)
        if (itemDate < filters.dateRange[0] || itemDate > filters.dateRange[1]) {
          return false
        }
      }

      // Rating filter
      if (filters.rating && (item as any).rating < filters.rating) {
        return false
      }

      // Usage count filter
      if (filters.usageCount && (item as any).usage_count < filters.usageCount) {
        return false
      }

      return true
    })
  }, [])

  // Export results
  const exportResults = useCallback((format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(state.results, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `search-results-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      if (state.results.length === 0) return
      
      const headers = Object.keys(state.results[0].item)
      const csvContent = [
        headers.join(','),
        ...state.results.map(result => 
          headers.map(header => 
            JSON.stringify((result.item as any)[header])
          ).join(',')
        )
      ].join('\n')
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `search-results-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }, [state.results])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    setQuery,
    setFilters,
    search,
    clearSearch,
    loadMore,
    getSuggestions,
    
    // Utilities
    highlightText,
    getFilteredResults,
    exportResults
  }
}
