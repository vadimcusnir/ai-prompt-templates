'use client'

import { useState, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchFiltersProps {
  onSearch: (query: string) => void
  onCategoryFilter: (category: string | null) => void
  searchQuery: string
  selectedCategory: string | null
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'deep_analysis', label: 'Deep Analysis' },
  { value: 'meaning_engineering', label: 'Meaning Engineering' },
  { value: 'cognitive_frameworks', label: 'Cognitive Frameworks' },
  { value: 'consciousness_mapping', label: 'Consciousness Mapping' },
  { value: 'advanced_systems', label: 'Advanced Systems' }
]

export function SearchFilters({ onSearch, onCategoryFilter, searchQuery, selectedCategory }: SearchFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  
  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce((query: string) => {
    onSearch(query)
  }, 500)

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setLocalSearchQuery(query)
    debouncedSearch(query)
  }, [debouncedSearch])

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === 'all' ? null : e.target.value
    onCategoryFilter(category)
  }, [onCategoryFilter])

  const handleResetFilters = useCallback(() => {
    setLocalSearchQuery('')
    onSearch('')
    onCategoryFilter(null)
  }, [onSearch, onCategoryFilter])

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto 2rem auto',
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search prompts..."
        value={localSearchQuery}
        onChange={handleSearchChange}
        style={{
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '1rem',
          minWidth: '250px',
          flex: '1'
        }}
      />

      {/* Category Filter */}
      <select
        value={selectedCategory || 'all'}
        onChange={handleCategoryChange}
        style={{
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '1rem',
          backgroundColor: 'white',
          minWidth: '200px'
        }}
      >
        {CATEGORIES.map(category => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>

      {/* Reset Filters Button */}
      <button
        onClick={handleResetFilters}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
      >
        Reset Filters
      </button>
    </div>
  )
}
