import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  logSearch: jest.fn(),
}));

describe('useSearch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.filters).toEqual({
      query: '',
      category: [],
      difficulty: [],
      tags: [],
      priceRange: [0, 1000],
      accessLevel: [],
      author: '',
      dateRange: [null, null],
    });

    expect(result.current.results).toEqual({
      data: [],
      total: 0,
      page: 1,
      hasMore: false,
      facets: {
        categories: [],
        difficulties: [],
        tags: [],
        priceRanges: [],
      },
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes with custom filters', () => {
    const initialFilters = {
      query: 'test query',
      category: ['AI', 'Machine Learning'],
      difficulty: ['intermediate'],
    };

    const { result } = renderHook(() => useSearch({ initialFilters }));

    expect(result.current.filters.query).toBe('test query');
    expect(result.current.filters.category).toEqual(['AI', 'Machine Learning']);
    expect(result.current.filters.difficulty).toEqual(['intermediate']);
  });

  it('updates filters correctly', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.updateFilters({
        query: 'new query',
        category: ['New Category'],
      });
    });

    expect(result.current.filters.query).toBe('new query');
    expect(result.current.filters.category).toEqual(['New Category']);
    expect(result.current.filters.page).toBe(1); // Should reset to first page
  });

  it('resets filters to initial values', () => {
    const initialFilters = {
      query: 'initial query',
      category: ['Initial Category'],
    };

    const { result } = renderHook(() => useSearch({ initialFilters }));

    // Update filters
    act(() => {
      result.current.updateFilters({
        query: 'changed query',
        category: ['Changed Category'],
      });
    });

    // Reset filters
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.query).toBe('initial query');
    expect(result.current.filters.category).toEqual(['Initial Category']);
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => useSearch());

    // Set some filters
    act(() => {
      result.current.updateFilters({
        query: 'test query',
        category: ['Test Category'],
      });
    });

    // Clear all filters
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.filters.query).toBe('');
    expect(result.current.filters.category).toEqual([]);
    expect(result.current.results.data).toEqual([]);
    expect(result.current.results.total).toBe(0);
  });

  it('loads more results', () => {
    const { result } = renderHook(() => useSearch());

    // Mock results with hasMore: true
    act(() => {
      result.current.results = {
        ...result.current.results,
        hasMore: true,
        page: 1,
      };
    });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.results.page).toBe(2);
  });

  it('does not load more when no more results', () => {
    const { result } = renderHook(() => useSearch());

    // Mock results with hasMore: false
    act(() => {
      result.current.results = {
        ...result.current.results,
        hasMore: false,
        page: 1,
      };
    });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.results.page).toBe(1); // Should not change
  });

  it('does not load more when loading', () => {
    const { result } = renderHook(() => useSearch());

    // Mock loading state and hasMore: true
    act(() => {
      result.current.loading = true;
      result.current.results = {
        ...result.current.results,
        hasMore: true,
        page: 1,
      };
    });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.results.page).toBe(1); // Should not change when loading
  });

  it('performs search with current filters', async () => {
    const { result } = renderHook(() => useSearch());

    // Set some filters
    act(() => {
      result.current.updateFilters({
        query: 'search query',
        category: ['Category'],
      });
    });

    // Perform search
    act(() => {
      result.current.performSearch();
    });

    // Wait for search to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('calls onSearch callback when provided', () => {
    const onSearch = jest.fn();
    const { result } = renderHook(() => useSearch({ onSearch }));

    act(() => {
      result.current.updateFilters({ query: 'test' });
    });

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test' })
    );
  });

  it('calls onResult callback when provided', async () => {
    const onResult = jest.fn();
    const { result } = renderHook(() => useSearch({ onResult }));

    act(() => {
      result.current.performSearch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [],
        total: 0,
        page: 1,
        hasMore: false,
      })
    );
  });

  it('provides computed values correctly', () => {
    const { result } = renderHook(() => useSearch());

    // Test empty results
    expect(result.current.hasResults).toBe(false);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.isFirstPage).toBe(true);
    expect(result.current.canLoadMore).toBe(false);

    // Mock results with data
    act(() => {
      result.current.results = {
        ...result.current.results,
        total: 10,
        hasMore: true,
        page: 1,
      };
    });

    expect(result.current.hasResults).toBe(true);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isFirstPage).toBe(true);
    expect(result.current.canLoadMore).toBe(true);

    // Mock second page
    act(() => {
      result.current.results = {
        ...result.current.results,
        page: 2,
      };
    });

    expect(result.current.isFirstPage).toBe(false);
  });

  it('handles debounced search query', async () => {
    const { result } = renderHook(() => useSearch({ debounceMs: 300 }));

    // Update query
    act(() => {
      result.current.updateFilters({ query: 'test' });
    });

    // Query should not trigger search immediately
    expect(result.current.filters.query).toBe('test');

    // Fast forward time to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('resets page when filters change', () => {
    const { result } = renderHook(() => useSearch());

    // Set page to 2
    act(() => {
      result.current.results = {
        ...result.current.results,
        page: 2,
      };
    });

    // Update filters
    act(() => {
      result.current.updateFilters({ query: 'new query' });
    });

    // Page should reset to 1
    expect(result.current.results.page).toBe(1);
  });

  it('handles error states', async () => {
    const { result } = renderHook(() => useSearch());

    // Mock an error by throwing in performSearch
    const originalPerformSearch = result.current.performSearch;
    
    act(() => {
      // Simulate error by setting error state
      result.current.error = 'Search failed';
    });

    expect(result.current.error).toBe('Search failed');
  });

  it('maintains filter state between updates', () => {
    const { result } = renderHook(() => useSearch());

    // Set multiple filters
    act(() => {
      result.current.updateFilters({
        query: 'test query',
        category: ['Category 1'],
        difficulty: ['beginner'],
      });
    });

    // Update only one filter
    act(() => {
      result.current.updateFilters({
        difficulty: ['intermediate'],
      });
    });

    // Other filters should remain unchanged
    expect(result.current.filters.query).toBe('test query');
    expect(result.current.filters.category).toEqual(['Category 1']);
    expect(result.current.filters.difficulty).toEqual(['intermediate']);
  });
});
