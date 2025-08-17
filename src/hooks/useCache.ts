'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  persist?: boolean // Whether to persist to localStorage
  namespace?: string // Namespace for localStorage
}

interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  oldestEntry: number | null
  newestEntry: number | null
}

class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private options: Required<CacheOptions>
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  }

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      persist: options.persist || false,
      namespace: options.namespace || 'app-cache'
    }

    if (this.options.persist) {
      this.loadFromStorage()
    }

    // Cleanup expired entries every minute
    setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    }

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, entry)

    if (this.options.persist) {
      this.saveToStorage()
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.stats.totalRequests++
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.totalRequests++
      
      if (this.options.persist) {
        this.saveToStorage()
      }
      
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.cache.set(key, entry)
    
    this.stats.hits++
    this.stats.totalRequests++

    return entry.value
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    
    if (deleted && this.options.persist) {
      this.saveToStorage()
    }
    
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.totalRequests = 0
    
    if (this.options.persist) {
      this.saveToStorage()
    }
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  entries(): [string, T][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value])
  }

  size(): number {
    return this.cache.size
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const timestamps = entries.map(entry => entry.timestamp)
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      totalRequests: this.stats.totalRequests,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    }
  }

  private evictLRU(): void {
    let lruKey: string | null = null
    let lruTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }

    if (this.options.persist) {
      this.saveToStorage()
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now()
      }
      
      localStorage.setItem(this.options.namespace, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = localStorage.getItem(this.options.namespace)
      if (data) {
        const parsed = JSON.parse(data)
        
        // Only restore if data is less than 1 hour old
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          this.cache = new Map(parsed.cache)
          this.stats = parsed.stats
        } else {
          // Clear old data
          localStorage.removeItem(this.options.namespace)
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
      localStorage.removeItem(this.options.namespace)
    }
  }
}

export function useCache<T>(options: CacheOptions = {}) {
  const cacheRef = useRef<CacheManager<T> | null>(null)
  const [stats, setStats] = useState<CacheStats>({
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    oldestEntry: null,
    newestEntry: null
  })

  // Initialize cache manager
  useEffect(() => {
    if (!cacheRef.current) {
      cacheRef.current = new CacheManager<T>(options)
    }

    // Update stats every second
    const interval = setInterval(() => {
      if (cacheRef.current) {
        setStats(cacheRef.current.getStats())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [options])

  const set = useCallback((key: string, value: T, ttl?: number) => {
    if (cacheRef.current) {
      cacheRef.current.set(key, value, ttl)
    }
  }, [])

  const get = useCallback((key: string): T | null => {
    if (cacheRef.current) {
      return cacheRef.current.get(key)
    }
    return null
  }, [])

  const has = useCallback((key: string): boolean => {
    if (cacheRef.current) {
      return cacheRef.current.has(key)
    }
    return false
  }, [])

  const deleteKey = useCallback((key: string): boolean => {
    if (cacheRef.current) {
      return cacheRef.current.delete(key)
    }
    return false
  }, [])

  const clear = useCallback(() => {
    if (cacheRef.current) {
      cacheRef.current.clear()
    }
  }, [])

  const keys = useCallback((): string[] => {
    if (cacheRef.current) {
      return cacheRef.current.keys()
    }
    return []
  }, [])

  const values = useCallback((): T[] => {
    if (cacheRef.current) {
      return cacheRef.current.values()
    }
    return []
  }, [])

  const entries = useCallback((): [string, T][] => {
    if (cacheRef.current) {
      return cacheRef.current.entries()
    }
    return []
  }, [])

  const size = useCallback((): number => {
    if (cacheRef.current) {
      return cacheRef.current.size()
    }
    return 0
  }, [])

  const getStats = useCallback((): CacheStats => {
    if (cacheRef.current) {
      return cacheRef.current.getStats()
    }
    return stats
  }, [stats])

  return {
    // Core operations
    set,
    get,
    has,
    delete: deleteKey,
    clear,
    
    // Utility methods
    keys,
    values,
    entries,
    size,
    
    // Statistics
    stats,
    getStats
  }
}

// Specialized cache hooks
export function useLocalStorageCache<T>(key: string, defaultValue: T, options: Omit<CacheOptions, 'persist'> = {}) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = useCallback((newValue: T) => {
    try {
      setValue(newValue)
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [key])

  const removeStoredValue = useCallback(() => {
    try {
      setValue(defaultValue)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }, [key, defaultValue])

  return [value, setStoredValue, removeStoredValue] as const
}

export function useSessionStorageCache<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = useCallback((newValue: T) => {
    try {
      setValue(newValue)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, JSON.stringify(newValue))
      }
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error)
    }
  }, [key])

  const removeStoredValue = useCallback(() => {
    try {
      setValue(defaultValue)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.warn('Failed to remove from sessionStorage:', error)
    }
  }, [key, defaultValue])

  return [value, setStoredValue, removeStoredValue] as const
}
