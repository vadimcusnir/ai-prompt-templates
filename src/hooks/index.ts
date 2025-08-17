// Core hooks
export { useAuth } from '@/contexts/AuthContext'
export { useNeurons } from './useNeurons'
export { useDebounce } from './useDebounce'

// Analytics and monitoring
export { useAnalytics } from './useAnalytics'
export { usePerformanceMonitor } from './usePerformanceMonitor'

// Error handling
export { useErrorBoundary, withErrorBoundary, useErrorReporter } from './useErrorBoundary'

// Data management
export { useCache, useLocalStorageCache, useSessionStorageCache } from './useCache'
export { useSearch } from './useSearch'
export { useValidation, useFormValidation, commonSchemas } from './useValidation'

// Internationalization
export { useI18n, useTranslations, useNumberFormat, useDateFormat } from './useI18n'

// Accessibility
export { useAccessibility } from './useAccessibility'

// Re-export types for convenience
export type {
  Neuron,
  NeuronFilters,
  NeuronSort,
  SearchFilters,
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  ValidationRule,
  ValidationSchema,
  ValidationError,
  Locale,
  Translation,
  AccessibilityConfig,
  AccessibilityState
} from './types'
