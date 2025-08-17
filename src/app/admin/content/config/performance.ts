// Configurații pentru optimizări de performanță
export const PERFORMANCE_CONFIG = {
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minute
  MAX_CACHE_SIZE: 1000, // Maximum number of items in cache
  
  // Debounce settings
  SEARCH_DEBOUNCE: 300, // ms
  FORM_DEBOUNCE: 500, // ms
  
  // Lazy loading settings
  LAZY_LOAD_THRESHOLD: 0.1, // Intersection Observer threshold
  LAZY_LOAD_MARGIN: '50px', // Intersection Observer margin
  
  // Bundle optimization
  CHUNK_SIZE_LIMIT: 100 * 1024, // 100KB
  MAX_CONCURRENT_CHUNKS: 3,
  
  // Memory management
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  GARBAGE_COLLECTION_INTERVAL: 30 * 1000, // 30 seconds
} as const

// Performance monitoring
export const PERFORMANCE_METRICS = {
  // Time thresholds
  SLOW_RENDER_THRESHOLD: 16, // ms (60fps)
  SLOW_FETCH_THRESHOLD: 1000, // ms
  
  // Memory thresholds
  HIGH_MEMORY_THRESHOLD: 80, // percentage
  
  // Error thresholds
  MAX_ERRORS_PER_MINUTE: 10,
  MAX_ERRORS_PER_SESSION: 100,
} as const

// Bundle splitting strategy
export const BUNDLE_SPLITTING = {
  // Critical chunks (loaded immediately)
  CRITICAL: ['admin-header', 'admin-navigation'],
  
  // Lazy chunks (loaded on demand)
  LAZY: ['prompt-form', 'prompt-list', 'admin-settings'],
  
  // Shared chunks (loaded once, reused)
  SHARED: ['types', 'utils', 'hooks'],
} as const
