// Shared Components
export { default as NeuronCard } from './components/NeuronCard';
export { default as Navigation } from './components/Navigation';
export { default as AuthForm } from './components/AuthForm';
export { default as SearchFilters } from './components/SearchFilters';
export { default as TableOfContents } from './components/TableOfContents';
export { default as CookieConsent } from './components/CookieConsent';
export { default as SEOHead } from './components/SEOHead';

// Shared Hooks
export { default as useAuth } from './hooks/useAuth';
export { default as useNeurons } from './hooks/useNeurons';
export { default as useSearch } from './hooks/useSearch';
export { default as useValidation } from './hooks/useValidation';
export { default as usePerformanceMonitor } from './hooks/usePerformanceMonitor';
export { default as useAccessibility } from './hooks/useAccessibility';
export { default as useAnalytics } from './hooks/useAnalytics';
export { default as useCache } from './hooks/useCache';
export { default as useDebounce } from './hooks/useDebounce';
export { default as useErrorBoundary } from './hooks/useErrorBoundary';
export { default as useI18n } from './hooks/useI18n';

// Shared Lib
export * from './lib/supabase-client';
export * from './lib/stripe-multi-brand';
export * from './lib/access-gating';
export * from './lib/analytics';
export * from './lib/logger';
export * from './lib/rate-limit';
export * from './lib/validation';

// Shared Types
export * from './types/brand';
export * from './types/database';
export * from './types/stripe';
export * from './types/user';

// Shared Utils
export * from './utils/cn';
export * from './utils/format';
export * from './utils/validation';

// Shared Styles
export * from './styles/brand-themes';
export * from './styles/globals';
