# AI Prompt Templates - Hooks Library

Această bibliotecă de hook-uri React oferă funcționalități complete pentru management-ul stării, validare, analytics, accessibility și internationalization.

## Hook-uri Core

### `useAuth`
Hook pentru management-ul autentificării cu Supabase.

```typescript
const { user, userTier, signIn, signOut } = useAuth()
```

### `useNeurons`
Hook pentru management-ul neuronilor cu caching și optimistic updates.

```typescript
const { 
  neurons, 
  loading, 
  createNeuron, 
  updateNeuron, 
  deleteNeuron 
} = useNeurons()
```

### `useDebounce`
Hook pentru debouncing cu multiple variante.

```typescript
const debouncedValue = useDebounce(value, 300)
const debouncedCallback = useDebounceCallback(callback, 300)
const [immediate, debounced, setValue] = useDebounceState(value, 300)
```

## Analytics și Monitoring

### `useAnalytics`
Hook pentru tracking-ul evenimentelor și analytics.

```typescript
const { 
  trackEvent, 
  trackPageView, 
  trackConversion,
  trackError 
} = useAnalytics()

// Track events
trackEvent('button_click', { buttonId: 'submit', page: 'checkout' })
trackPageView('/dashboard', 'User Dashboard')
trackConversion('signup', 'completed', { source: 'landing_page' })
```

### `usePerformanceMonitor`
Hook pentru monitoring-ul performanței cu Core Web Vitals.

```typescript
const { 
  metrics, 
  generatePerformanceReport 
} = usePerformanceMonitor()

// Get current metrics
const currentMetrics = metrics
const report = generatePerformanceReport()
```

## Error Handling

### `useErrorBoundary`
Hook pentru error boundaries cu recovery automat.

```typescript
const { 
  hasError, 
  handleError, 
  resetError,
  ErrorBoundaryWrapper 
} = useErrorBoundary({
  maxRetries: 3,
  autoRecover: true
})

// Wrap component
<ErrorBoundaryWrapper>
  <YourComponent />
</ErrorBoundaryWrapper>
```

### `useErrorReporter`
Hook pentru raportarea erorilor.

```typescript
const { reportError, reportWarning } = useErrorReporter()

try {
  // Your code
} catch (error) {
  reportError(error, { context: 'user_action' })
}
```

## Data Management

### `useCache`
Hook pentru caching cu TTL și LRU eviction.

```typescript
const { 
  set, 
  get, 
  has, 
  delete: deleteKey, 
  clear,
  stats 
} = useCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  persist: true
})

// Cache operations
set('user:123', userData, 10 * 60 * 1000) // 10 minutes TTL
const user = get('user:123')
const exists = has('user:123')
```

### `useSearch`
Hook pentru căutare avansată cu filtrare și fuzzy matching.

```typescript
const { 
  query, 
  results, 
  loading, 
  setQuery, 
  setFilters,
  search,
  loadMore 
} = useSearch(data, ['title', 'content', 'tags'], {
  fuzzy: true,
  maxResults: 20
})

// Search operations
setQuery('AI prompts')
setFilters({ category: 'technology', difficulty: 'intermediate' })
await search()
await loadMore()
```

### `useValidation`
Hook pentru validare cu schema și custom rules.

```typescript
const { 
  errors, 
  isValid, 
  validate, 
  validateField,
  markFieldAsTouched 
} = useValidation({
  email: { required: true, email: true },
  password: { 
    required: true, 
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  }
})

// Validation operations
const errors = validate(values)
const fieldError = validateField('email', 'invalid-email')
markFieldAsTouched('email')
```

## Internationalization

### `useI18n`
Hook principal pentru internationalization.

```typescript
const { 
  locale, 
  t, 
  n, 
  d, 
  c, 
  setLocale 
} = useI18n()

// Translation and formatting
const message = t('common.welcome', { name: 'John' })
const number = n(1234.56, { style: 'currency', currency: 'USD' })
const date = d(new Date(), { dateStyle: 'full' })
const price = c(99.99, 'EUR')
```

### `useTranslations`
Hook pentru namespace-uri specifice.

```typescript
const { t, locale, isLoading } = useTranslations('dashboard')

const title = t('welcome_message')
const subtitle = t('user_greeting', { username: 'John' })
```

### `useNumberFormat`
Hook pentru formatarea numerelor.

```typescript
const { 
  formatNumber, 
  formatPercent, 
  formatCurrency 
} = useNumberFormat()

const number = formatNumber(1234.56)
const percent = formatPercent(0.85)
const currency = formatCurrency(99.99, 'EUR')
```

### `useDateFormat`
Hook pentru formatarea datelor.

```typescript
const { 
  formatDate, 
  formatTime, 
  formatDateTime,
  formatRelative 
} = useDateFormat()

const date = formatDate(new Date())
const time = formatTime(new Date())
const datetime = formatDateTime(new Date())
const relative = formatRelative(new Date()) // "2 hours ago"
```

## Accessibility

### `useAccessibility`
Hook pentru accessibility features.

```typescript
const { 
  isScreenReaderActive,
  announceToScreenReader,
  setFocus,
  trapFocus,
  addARIALabel,
  setARIAExpanded 
} = useAccessibility({
  enableScreenReader: true,
  enableKeyboardNavigation: true,
  enableARIA: true
})

// Accessibility operations
announceToScreenReader('Form submitted successfully')
setFocus('submit-button')
trapFocus('modal-container')
addARIALabel('search-input', 'Search for prompts')
setARIAExpanded('menu-button', true)
```

## Utilizare în Componente

### Exemplu de Component cu Multiple Hook-uri

```typescript
import React from 'react'
import { 
  useNeurons, 
  useSearch, 
  useAnalytics, 
  useAccessibility,
  useI18n 
} from '@/hooks'

export function NeuronSearch() {
  const { neurons, loading } = useNeurons()
  const { query, results, setQuery, search } = useSearch(neurons, ['title', 'content'])
  const { trackSearch } = useAnalytics()
  const { announceToScreenReader } = useAccessibility()
  const { t } = useI18n()

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    await search()
    
    trackSearch(searchQuery, results.length)
    announceToScreenReader(`Found ${results.length} results`)
  }

  return (
    <div>
      <input
        type="text"
        placeholder={t('common.search')}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        aria-label={t('search.input_label')}
      />
      
      {loading && <div>{t('common.loading')}</div>}
      
      <div role="list">
        {results.map(result => (
          <div key={result.item.id} role="listitem">
            <h3>{result.item.title}</h3>
            <p>{result.item.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Exemplu de Form cu Validare

```typescript
import React from 'react'
import { useFormValidation, commonSchemas } from '@/hooks'

export function UserForm() {
  const { 
    values, 
    setFieldValue, 
    errors, 
    isValid, 
    handleSubmit,
    isSubmitting 
  } = useFormValidation({
    ...commonSchemas.email,
    ...commonSchemas.password,
    name: { required: true, minLength: 2 }
  })

  const onSubmit = async (formValues: typeof values) => {
    // Submit logic
    console.log('Form submitted:', formValues)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit) }}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={values.name || ''}
          onChange={(e) => setFieldValue('name', e.target.value)}
        />
        {errors.find(e => e.field === 'name')?.message}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={values.email || ''}
          onChange={(e) => setFieldValue('email', e.target.value)}
        />
        {errors.find(e => e.field === 'email')?.message}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={values.password || ''}
          onChange={(e) => setFieldValue('password', e.target.value)}
        />
        {errors.find(e => e.field === 'password')?.message}
      </div>

      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

## Configurare

### Provider Setup

```typescript
// app/providers.tsx
import { AuthProvider } from '@/contexts/AuthContext'
import { Provider as ChakraProvider } from '@/components/ui/provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ChakraProvider>
  )
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Testing

### Test Setup

```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Hook Testing

```typescript
// __tests__/hooks/useNeurons.test.ts
import { renderHook, act } from '@testing-library/react'
import { useNeurons } from '@/hooks/useNeurons'
import { AuthProvider } from '@/contexts/AuthContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useNeurons', () => {
  it('should fetch neurons successfully', async () => {
    const { result } = renderHook(() => useNeurons(), { wrapper })
    
    expect(result.current.loading).toBe(true)
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.neurons).toBeDefined()
  })
})
```

## Performance

### Optimizări Implementate

- **Debouncing** pentru search și input-uri
- **Caching** cu TTL și LRU eviction
- **Optimistic updates** pentru UX fluid
- **Lazy loading** pentru date mari
- **Memoization** pentru calcule costisitoare

### Bundle Size

Hook-urile sunt tree-shakeable și pot fi importate individual:

```typescript
// Import doar ce ai nevoie
import { useNeurons } from '@/hooks/useNeurons'
import { useAnalytics } from '@/hooks/useAnalytics'

// Sau import toate
import * as Hooks from '@/hooks'
```

## Contribuții

Pentru a contribui la această bibliotecă:

1. Fork repository-ul
2. Creează un branch pentru feature-ul tău
3. Implementează cu testele corespunzătoare
4. Submit un pull request

## Licență

MIT License - vezi [LICENSE](../LICENSE) pentru detalii.
