// Neuron types
export interface Neuron {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  author_id: string
  created_at: string
  updated_at: string
  is_public: boolean
  usage_count: number
  rating: number
  price_cents: number
  required_tier: 'free' | 'architect' | 'initiate' | 'elite'
  depth_score?: number
  pattern_complexity?: number
}

export interface NeuronFilters {
  category?: string
  difficulty?: string
  tags?: string[]
  search?: string
  price_range?: [number, number]
  required_tier?: string
  author_id?: string
}

export interface NeuronSort {
  field: 'created_at' | 'updated_at' | 'usage_count' | 'rating' | 'price_cents' | 'title'
  direction: 'asc' | 'desc'
}

// Search types
export interface SearchFilters {
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

export interface SearchOptions {
  fuzzy?: boolean
  includeSynonyms?: boolean
  searchInContent?: boolean
  searchInTags?: boolean
  searchInAuthor?: boolean
  maxResults?: number
  sortBy?: 'relevance' | 'date' | 'rating' | 'usage' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult<T> {
  item: T
  score: number
  highlights: string[]
  matchedFields: string[]
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'category' | 'tag' | 'author'
  count: number
  relevance: number
}

// Validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  url?: boolean
  numeric?: boolean
  integer?: boolean
  positive?: boolean
  min?: number
  max?: number
  custom?: (value: any, allValues?: Record<string, any>) => string | null
  message?: string
}

export interface ValidationSchema {
  [field: string]: ValidationRule | ValidationRule[]
}

export interface ValidationError {
  field: string
  message: string
  value: any
}

// Internationalization types
export interface Locale {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  dateFormat: string
  timeFormat: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
}

export interface Translation {
  [key: string]: string | Translation | ((params: Record<string, any>) => string)
}

// Accessibility types
export interface AccessibilityConfig {
  enableScreenReader?: boolean
  enableKeyboardNavigation?: boolean
  enableFocusManagement?: boolean
  enableARIA?: boolean
  enableHighContrast?: boolean
  enableReducedMotion?: boolean
  enableLargeText?: boolean
}

export interface AccessibilityState {
  isScreenReaderActive: boolean
  isKeyboardNavigating: boolean
  isHighContrast: boolean
  isReducedMotion: boolean
  isLargeText: boolean
  currentFocus: string | null
  focusHistory: string[]
}

// Cache types
export interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

export interface CacheOptions {
  ttl?: number
  maxSize?: number
  persist?: boolean
  namespace?: string
}

export interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  oldestEntry: number | null
  newestEntry: number | null
}

// Analytics types
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface PageViewEvent {
  path: string
  title: string
  referrer?: string
  timestamp: number
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

export interface UserInteraction {
  element: string
  action: string
  properties?: Record<string, any>
  timestamp: number
}

// Performance monitoring types
export interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  pageLoadTime: number | null
  domContentLoaded: number | null
}

export interface ResourceTiming {
  name: string
  duration: number
  size: number
  type: string
}

// Error boundary types
export interface ErrorInfo {
  error: Error
  errorInfo: React.ErrorInfo | null
  timestamp: number
  componentStack: string
  url: string
  userAgent: string
  userId?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
  lastErrorTime: number
}

export interface ErrorRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  autoRecover?: boolean
  logToConsole?: boolean
  sendToAnalytics?: boolean
}
