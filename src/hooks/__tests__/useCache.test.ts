import { renderHook, act, waitFor } from '@testing-library/react'
import { useCache, useLocalStorageCache, useSessionStorageCache } from '../useCache'

describe('useCache', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear()
    sessionStorage.clear()
    jest.clearAllMocks()
  })

  describe('useCache', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useCache<string>())

      expect(result.current.size()).toBe(0)
      expect(result.current.stats.size).toBe(0)
      expect(result.current.stats.hits).toBe(0)
      expect(result.current.stats.misses).toBe(0)
    })

    it('should set and get values', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
      })

      expect(result.current.get('key1')).toBe('value1')
      expect(result.current.get('key2')).toBe('value2')
      expect(result.current.size()).toBe(2)
    })

    it('should check if key exists', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
      })

      expect(result.current.has('key1')).toBe(true)
      expect(result.current.has('key2')).toBe(false)
    })

    it('should delete keys', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
      })

      expect(result.current.size()).toBe(2)

      act(() => {
        result.current.delete('key1')
      })

      expect(result.current.has('key1')).toBe(false)
      expect(result.current.has('key2')).toBe(true)
      expect(result.current.size()).toBe(1)
    })

    it('should clear all keys', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
      })

      expect(result.current.size()).toBe(2)

      act(() => {
        result.current.clear()
      })

      expect(result.current.size()).toBe(0)
      expect(result.current.has('key1')).toBe(false)
      expect(result.current.has('key2')).toBe(false)
    })

    it('should return all keys, values, and entries', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
      })

      expect(result.current.keys()).toEqual(['key1', 'key2'])
      expect(result.current.values()).toEqual(['value1', 'value2'])
      expect(result.current.entries()).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
    })

    it('should respect TTL', async () => {
      jest.useFakeTimers()
      
      const { result } = renderHook(() => useCache<string>({ ttl: 1000 }))

      act(() => {
        result.current.set('key1', 'value1')
      })

      expect(result.current.get('key1')).toBe('value1')

      // Fast forward time past TTL
      act(() => {
        jest.advanceTimersByTime(1001)
      })

      // Value should be expired
      expect(result.current.get('key1')).toBeNull()
      expect(result.current.has('key1')).toBe(false)

      jest.useRealTimers()
    })

    it('should respect maxSize with LRU eviction', () => {
      const { result } = renderHook(() => useCache<string>({ maxSize: 2 }))

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
        result.current.set('key3', 'value3') // This should evict key1
      })

      expect(result.current.size()).toBe(2)
      expect(result.current.has('key1')).toBe(false) // Should be evicted
      expect(result.current.has('key2')).toBe(true)
      expect(result.current.has('key3')).toBe(true)
    })

    it('should track access statistics', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
      })

      // First access
      result.current.get('key1')
      expect(result.current.stats.hits).toBe(1)
      expect(result.current.stats.misses).toBe(0)
      expect(result.current.stats.totalRequests).toBe(1)

      // Second access
      result.current.get('key1')
      expect(result.current.stats.hits).toBe(2)
      expect(result.current.stats.totalRequests).toBe(2)

      // Access non-existent key
      result.current.get('key2')
      expect(result.current.stats.hits).toBe(2)
      expect(result.current.stats.misses).toBe(1)
      expect(result.current.stats.totalRequests).toBe(3)
    })

    it('should calculate hit rate correctly', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('key1', 'value1')
      })

      // 2 hits, 1 miss = 2/3 = 0.67
      result.current.get('key1') // hit
      result.current.get('key1') // hit
      result.current.get('key2') // miss

      expect(result.current.stats.hitRate).toBeCloseTo(0.67, 2)
    })

    it('should persist to localStorage when enabled', () => {
      const { result } = renderHook(() => useCache<string>({ persist: true, namespace: 'test-cache' }))

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
      })

      // Check if data was saved to localStorage
      const savedData = localStorage.getItem('test-cache')
      expect(savedData).toBeTruthy()

      const parsedData = JSON.parse(savedData!)
      expect(parsedData.cache).toHaveLength(2)
      expect(parsedData.timestamp).toBeTruthy()
    })

    it('should load from localStorage on initialization', () => {
      // Pre-populate localStorage
      const testData = {
        cache: [['key1', 'value1'], ['key2', 'value2']],
        stats: { hits: 5, misses: 2, totalRequests: 7 },
        timestamp: Date.now()
      }
      localStorage.setItem('test-cache', JSON.stringify(testData))

      const { result } = renderHook(() => useCache<string>({ persist: true, namespace: 'test-cache' }))

      // Wait for the cache to load
      waitFor(() => {
        expect(result.current.size()).toBe(2)
        expect(result.current.get('key1')).toBe('value1')
        expect(result.current.get('key2')).toBe('value2')
      })
    })

    it('should not load expired data from localStorage', () => {
      // Pre-populate localStorage with old data
      const oldData = {
        cache: [['key1', 'value1']],
        stats: { hits: 1, misses: 0, totalRequests: 1 },
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      }
      localStorage.setItem('test-cache', JSON.stringify(oldData))

      const { result } = renderHook(() => useCache<string>({ persist: true, namespace: 'test-cache' }))

      waitFor(() => {
        expect(result.current.size()).toBe(0)
        expect(localStorage.getItem('test-cache')).toBeNull() // Should be cleared
      })
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useCache<string>({ persist: true }))

      // Should not crash when setting values
      act(() => {
        result.current.set('key1', 'value1')
      })

      expect(result.current.get('key1')).toBe('value1') // Should still work in memory

      // Restore original localStorage
      localStorage.setItem = originalSetItem
    })

    it('should cleanup expired entries automatically', async () => {
      jest.useFakeTimers()
      
      const { result } = renderHook(() => useCache<string>({ ttl: 1000 }))

      act(() => {
        result.current.set('key1', 'value1')
        result.current.set('key2', 'value2')
      })

      expect(result.current.size()).toBe(2)

      // Fast forward time past TTL
      act(() => {
        jest.advanceTimersByTime(1001)
      })

      // Wait for cleanup interval (runs every hour)
      act(() => {
        jest.advanceTimersByTime(60 * 60 * 1000)
      })

      expect(result.current.size()).toBe(0)

      jest.useRealTimers()
    })
  })

  describe('useLocalStorageCache', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useLocalStorageCache('test-key', 'default-value'))

      const [value, setValue, removeValue] = result.current
      expect(value).toBe('default-value')
    })

    it('should load existing value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('saved-value'))

      const { result } = renderHook(() => useLocalStorageCache('test-key', 'default-value'))

      const [value] = result.current
      expect(value).toBe('saved-value')
    })

    it('should save value to localStorage', () => {
      const { result } = renderHook(() => useLocalStorageCache('test-key', 'default-value'))

      const [value, setValue] = result.current

      act(() => {
        setValue('new-value')
      })

      expect(result.current[0]).toBe('new-value')
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
    })

    it('should remove value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('saved-value'))

      const { result } = renderHook(() => useLocalStorageCache('test-key', 'default-value'))

      const [value, setValue, removeValue] = result.current

      act(() => {
        removeValue()
      })

      expect(result.current[0]).toBe('default-value')
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useLocalStorageCache('test-key', 'default-value'))

      const [value, setValue] = result.current

      // Should not crash when setting values
      act(() => {
        setValue('new-value')
      })

      expect(result.current[0]).toBe('new-value') // Should still update state

      // Restore original localStorage
      localStorage.setItem = originalSetItem
    })
  })

  describe('useSessionStorageCache', () => {
    it('should initialize with default value', () => {
      const { result } = renderHook(() => useSessionStorageCache('test-key', 'default-value'))

      const [value, setValue, removeValue] = result.current
      expect(value).toBe('default-value')
    })

    it('should load existing value from sessionStorage', () => {
      sessionStorage.setItem('test-key', JSON.stringify('saved-value'))

      const { result } = renderHook(() => useSessionStorageCache('test-key', 'default-value'))

      const [value] = result.current
      expect(value).toBe('saved-value')
    })

    it('should save value to sessionStorage', () => {
      const { result } = renderHook(() => useSessionStorageCache('test-key', 'default-value'))

      const [value, setValue] = result.current

      act(() => {
        setValue('new-value')
      })

      expect(result.current[0]).toBe('new-value')
      expect(sessionStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
    })

    it('should remove value from sessionStorage', () => {
      sessionStorage.setItem('test-key', JSON.stringify('saved-value'))

      const { result } = renderHook(() => useSessionStorageCache('test-key', 'default-value'))

      const [value, setValue, removeValue] = result.current

      act(() => {
        removeValue()
      })

      expect(result.current[0]).toBe('default-value')
      expect(sessionStorage.getItem('test-key')).toBeNull()
    })

    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw error
      const originalSetItem = sessionStorage.setItem
      sessionStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useSessionStorageCache('test-key', 'default-value'))

      const [value, setValue] = result.current

      // Should not crash when setting values
      act(() => {
        setValue('new-value')
      })

      expect(result.current[0]).toBe('new-value') // Should still update state

      // Restore original sessionStorage
      sessionStorage.setItem = originalSetItem
    })
  })

  describe('edge cases', () => {
    it('should handle undefined values', () => {
      const { result } = renderHook(() => useCache<any>())

      act(() => {
        result.current.set('key1', undefined)
      })

      expect(result.current.get('key1')).toBeUndefined()
      expect(result.current.has('key1')).toBe(true)
    })

    it('should handle null values', () => {
      const { result } = renderHook(() => useCache<any>())

      act(() => {
        result.current.set('key1', null)
      })

      expect(result.current.get('key1')).toBeNull()
      expect(result.current.has('key1')).toBe(true)
    })

    it('should handle object values', () => {
      const { result } = renderHook(() => useCache<object>())

      const testObj = { name: 'test', value: 123 }

      act(() => {
        result.current.set('key1', testObj)
      })

      expect(result.current.get('key1')).toEqual(testObj)
    })

    it('should handle array values', () => {
      const { result } = renderHook(() => useCache<number[]>())

      const testArray = [1, 2, 3, 4, 5]

      act(() => {
        result.current.set('key1', testArray)
      })

      expect(result.current.get('key1')).toEqual(testArray)
    })

    it('should handle empty string keys', () => {
      const { result } = renderHook(() => useCache<string>())

      act(() => {
        result.current.set('', 'empty-key-value')
      })

      expect(result.current.get('')).toBe('empty-key-value')
      expect(result.current.has('')).toBe(true)
    })

    it('should handle special characters in keys', () => {
      const { result } = renderHook(() => useCache<string>())

      const specialKey = 'key-with-special-chars!@#$%^&*()'

      act(() => {
        result.current.set(specialKey, 'special-value')
      })

      expect(result.current.get(specialKey)).toBe('special-value')
      expect(result.current.has(specialKey)).toBe(true)
    })
  })
})
