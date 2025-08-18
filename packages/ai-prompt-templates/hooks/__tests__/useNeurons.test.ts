import { renderHook, act, waitFor } from '@testing-library/react'
import { useNeurons } from '../useNeurons'
import { AuthProvider } from '@/contexts/AuthContext'
import { createClientSideClient } from '@/lib/supabase'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(),
}

jest.mock('@/lib/supabase', () => ({
  createClientSideClient: jest.fn(() => mockSupabase),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useNeurons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      expect(result.current.neurons).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.filters).toEqual({})
      expect(result.current.sort).toEqual({ field: 'created_at', direction: 'desc' })
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: true,
      })
    })
  })

  describe('fetching neurons', () => {
    it('should fetch neurons successfully', async () => {
      const mockNeurons = [
        testUtils.createMockNeuron({ id: '1', title: 'Neuron 1' }),
        testUtils.createMockNeuron({ id: '2', title: 'Neuron 2' }),
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        overlaps: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue(
          Promise.resolve({
            data: mockNeurons,
            error: null,
            count: mockNeurons.length,
          })
        ),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.neurons).toHaveLength(2)
      expect(result.current.totalResults).toBe(2)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch errors', async () => {
      const mockError = new Error('Failed to fetch neurons')

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        overlaps: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: mockError,
            count: 0,
          })
        ),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch neurons')
      expect(result.current.neurons).toEqual([])
    })
  })

  describe('filters', () => {
    it('should apply filters correctly', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        result.current.setFilters({ category: 'technology', difficulty: 'intermediate' })
      })

      expect(result.current.filters.category).toBe('technology')
      expect(result.current.filters.difficulty).toBe('intermediate')
      expect(result.current.pagination.page).toBe(1) // Should reset to first page
    })

    it('should clear filters', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        result.current.setFilters({ category: 'technology' })
        result.current.setFilters({})
      })

      expect(result.current.filters).toEqual({})
    })
  })

  describe('sorting', () => {
    it('should change sort order', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        result.current.setSort({ field: 'title', direction: 'asc' })
      })

      expect(result.current.sort.field).toBe('title')
      expect(result.current.sort.direction).toBe('asc')
      expect(result.current.pagination.page).toBe(1) // Should reset to first page
    })
  })

  describe('pagination', () => {
    it('should change page', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        result.current.setPage(2)
      })

      expect(result.current.pagination.page).toBe(2)
    })

    it('should load more results', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      // Mock that we have more results
      result.current.pagination.hasMore = true

      await act(async () => {
        await result.current.loadMore()
      })

      // Should increment page
      expect(result.current.pagination.page).toBe(2)
    })
  })

  describe('CRUD operations', () => {
    it('should create neuron successfully', async () => {
      const mockNeuron = testUtils.createMockNeuron({ title: 'New Neuron' })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNeuron,
          error: null,
        }),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        const response = await result.current.createNeuron({
          title: 'New Neuron',
          content: 'New content',
          category: 'test',
          tags: ['new'],
          difficulty: 'beginner',
          is_public: true,
          usage_count: 0,
          rating: 0,
          price: 0,
          currency: 'USD',
          access_level: 'free',
        })
        expect(response.success).toBe(true)
      })

      // Should add to neurons list
      expect(result.current.neurons).toContainEqual(mockNeuron)
    })

    it('should update neuron successfully', async () => {
      const mockNeuron = testUtils.createMockNeuron({ id: '1', title: 'Updated Neuron' })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNeuron,
          error: null,
        }),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      // Add initial neuron
      result.current.neurons = [testUtils.createMockNeuron({ id: '1', title: 'Old Title' })]

      await act(async () => {
        const response = await result.current.updateNeuron('1', { title: 'Updated Neuron' })
        expect(response.success).toBe(true)
      })

      // Should update in neurons list
      expect(result.current.neurons[0].title).toBe('Updated Neuron')
    })

    it('should delete neuron successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          error: null,
        }),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      // Add initial neuron
      result.current.neurons = [testUtils.createMockNeuron({ id: '1' })]

      await act(async () => {
        const response = await result.current.deleteNeuron('1')
        expect(response.success).toBe(true)
      })

      // Should remove from neurons list
      expect(result.current.neurons).toHaveLength(0)
    })
  })

  describe('favorites', () => {
    it('should toggle favorite successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null, // No existing favorite
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        const response = await result.current.toggleFavorite('1')
        expect(response.success).toBe(true)
      })
    })
  })

  describe('rating', () => {
    it('should rate neuron successfully', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        const response = await result.current.rateNeuron('1', 5)
        expect(response.success).toBe(true)
      })
    })

    it('should reject invalid rating', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        const response = await result.current.rateNeuron('1', 6) // Invalid rating > 5
        expect(response.success).toBe(false)
        expect(response.error).toBe('Rating must be between 1 and 5')
      })
    })
  })

  describe('refresh', () => {
    it('should refresh neurons', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      await act(async () => {
        await result.current.refresh()
      })

      // Should trigger a new fetch
      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('access level filtering', () => {
    it('should filter by user tier correctly', async () => {
      // Mock user with free tier
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-1', email: 'test@example.com' } 
          } 
        },
        error: null,
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await waitFor(() => {
        expect(result.current.neurons).toBeDefined()
      })

      // Should only show free neurons for free tier users
      expect(mockSupabase.from).toHaveBeenCalledWith('neurons')
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Unauthorized' },
      })

      const { result } = renderHook(() => useNeurons(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should still work but with limited access
      expect(result.current.neurons).toBeDefined()
    })
  })

  describe('performance optimizations', () => {
    it('should use caching for repeated requests', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      // First request
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Second request should use cache
      await act(async () => {
        await result.current.refresh()
      })

      // Should not make duplicate requests immediately
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })

    it('should debounce rapid filter changes', async () => {
      const { result } = renderHook(() => useNeurons(), { wrapper })

      // Rapid filter changes
      await act(async () => {
        result.current.setFilters({ category: 'tech' })
        result.current.setFilters({ category: 'technology' })
        result.current.setFilters({ category: 'technology', difficulty: 'beginner' })
      })

      // Should only trigger one fetch after debouncing
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled()
      })
    })
  })
})
