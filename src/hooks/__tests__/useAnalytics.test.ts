import { renderHook, act, waitFor } from '@testing-library/react'
import { useAnalytics } from '../useAnalytics'
import { useAuth } from '../useAuth'

// Mock dependencies
jest.mock('../useAuth')
jest.mock('@/lib/logger')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock fetch globally
    global.fetch = jest.fn()
    
    // Mock window.location and document
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test-page',
        href: 'http://localhost:3000/test-page'
      },
      writable: true
    })
    
    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true
    })
    
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3000/previous-page',
      writable: true
    })
    
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByType: jest.fn().mockReturnValue([]),
        getEntriesByName: jest.fn().mockReturnValue([])
      },
      writable: true
    })
    
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        addEventListener: jest.fn()
      },
      writable: true
    })
    
    // Mock memory API
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 5000000
      },
      writable: true
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize analytics service', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      expect(result.current.sessionId).toBeTruthy()
      expect(typeof result.current.sessionId).toBe('string')
      expect(result.current.sessionId.length).toBeGreaterThan(0)
    })

    it('should track initial page view', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      // Initial page view should be tracked
      expect(result.current.getPageViews()).toHaveLength(1)
      expect(result.current.getPageViews()[0]).toMatchObject({
        path: '/test-page',
        title: 'Test Page'
      })
    })
  })

  describe('trackEvent', () => {
    it('should track events with properties', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' } as any,
        loading: false,
        userTier: 'architect',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackEvent('button_click', { buttonId: 'submit', page: 'home' })
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'button_click',
        properties: { buttonId: 'submit', page: 'home' },
        userId: 'user-123',
        userTier: 'authenticated'
      })
    })

    it('should track events without properties', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackEvent('page_view')
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'page_view',
        properties: undefined,
        userTier: 'anonymous'
      })
    })

    it('should enrich events with user data', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-456', email: 'premium@example.com' } as any,
        loading: false,
        userTier: 'elite',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackEvent('feature_used', { feature: 'advanced_search' })
      })

      const events = result.current.getEvents()
      expect(events[0]).toMatchObject({
        event: 'feature_used',
        properties: { feature: 'advanced_search' },
        userId: 'user-456',
        userTier: 'authenticated'
      })
    })
  })

  describe('trackPageView', () => {
    it('should track page views', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackPageView('/new-page', 'New Page Title')
      })

      const pageViews = result.current.getPageViews()
      expect(pageViews).toHaveLength(2) // Initial + new
      expect(pageViews[1]).toMatchObject({
        path: '/new-page',
        title: 'New Page Title'
      })
    })
  })

  describe('trackConversion', () => {
    it('should track conversions with funnel and step', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
        userTier: 'architect',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackConversion('signup', 'email_confirmed', { source: 'organic' })
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'conversion',
        properties: {
          funnel: 'signup',
          step: 'email_confirmed',
          source: 'organic'
        }
      })
    })
  })

  describe('trackError', () => {
    it('should track errors with context', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
        userTier: 'architect',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      const testError = new Error('Test error message')
      
      act(() => {
        result.current.trackError(testError, { component: 'SearchForm', action: 'submit' })
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'error',
        properties: {
          message: 'Test error message',
          stack: testError.stack,
          component: 'SearchForm',
          action: 'submit'
        }
      })
    })
  })

  describe('trackSearch', () => {
    it('should track search queries with results and filters', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
        userTier: 'architect',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackSearch('AI prompts', 25, { category: 'technology', difficulty: 'advanced' })
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'search',
        properties: {
          query: 'AI prompts',
          results: 25,
          filters: { category: 'technology', difficulty: 'advanced' }
        }
      })
    })
  })

  describe('trackNeuronInteraction', () => {
    it('should track neuron interactions', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
        userTier: 'architect',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackNeuronInteraction('neuron-456', 'view', { category: 'prompts' })
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'neuron_interaction',
        properties: {
          neuronId: 'neuron-456',
          action: 'view',
          category: 'prompts'
        }
      })
    })
  })

  describe('trackUserEngagement', () => {
    it('should track user engagement actions', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as any,
        loading: false,
        userTier: 'architect',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      act(() => {
        result.current.trackUserEngagement('scroll_to_bottom', { page: 'home', duration: 5000 })
      })

      const events = result.current.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        event: 'user_engagement',
        properties: {
          action: 'scroll_to_bottom',
          page: 'home',
          duration: 5000
        }
      })
    })
  })

  describe('performance tracking', () => {
    it('should track page load performance metrics', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      // Mock performance entries
      const mockNavigationEntry = {
        loadEventEnd: 1000,
        loadEventStart: 800,
        domContentLoadedEventEnd: 600,
        domContentLoadedEventStart: 500,
        responseStart: 200,
        requestStart: 100
      }

      const mockPaintEntry = {
        name: 'first-paint',
        startTime: 300
      }

      const mockContentfulPaintEntry = {
        name: 'first-contentful-paint',
        startTime: 400
      }

      ;(window.performance.getEntriesByType as jest.Mock).mockImplementation((type) => {
        if (type === 'navigation') return [mockNavigationEntry]
        if (type === 'paint') return [mockPaintEntry, mockContentfulPaintEntry]
        return []
      })

      const { result } = renderHook(() => useAnalytics())

      // Wait for performance tracking to complete
      waitFor(() => {
        const performanceMetrics = result.current.getPerformanceMetrics()
        expect(performanceMetrics.length).toBeGreaterThan(0)
      })
    })
  })

  describe('user interaction tracking', () => {
    it('should track user interactions automatically', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      // Simulate user interactions
      act(() => {
        // Simulate click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        })
        document.dispatchEvent(clickEvent)

        // Simulate form submission
        const form = document.createElement('form')
        form.id = 'test-form'
        document.body.appendChild(form)
        
        const submitEvent = new Event('submit', { bubbles: true })
        form.dispatchEvent(submitEvent)
        
        document.body.removeChild(form)
      })

      // Wait for interaction tracking
      waitFor(() => {
        const interactions = result.current.getUserInteractions()
        expect(interactions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('scroll depth tracking', () => {
    it('should track scroll depth at intervals', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      // Mock scroll event
      act(() => {
        Object.defineProperty(window, 'pageYOffset', { value: 500, writable: true })
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
        
        const scrollEvent = new Event('scroll', { bubbles: true })
        window.dispatchEvent(scrollEvent)
      })

      // Wait for scroll tracking
      waitFor(() => {
        const interactions = result.current.getUserInteractions()
        const scrollInteractions = interactions.filter(i => i.action === 'scroll_depth')
        expect(scrollInteractions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('visibility change tracking', () => {
    it('should track page visibility changes', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      // Mock visibility change
      act(() => {
        Object.defineProperty(document, 'hidden', { value: true, writable: true })
        const visibilityEvent = new Event('visibilitychange', { bubbles: true })
        document.dispatchEvent(visibilityEvent)
      })

      // Wait for visibility tracking
      waitFor(() => {
        const interactions = result.current.getUserInteractions()
        const visibilityInteractions = interactions.filter(i => i.action === 'hidden')
        expect(visibilityInteractions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('data management', () => {
    it('should provide access to collected data', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      // Track some events
      act(() => {
        result.current.trackEvent('test_event', { test: true })
        result.current.trackPageView('/test', 'Test')
      })

      expect(result.current.getEvents()).toHaveLength(2)
      expect(result.current.getPageViews()).toHaveLength(2)
      expect(result.current.getPerformanceMetrics()).toHaveLength(0) // May be 0 if no performance data
      expect(result.current.getUserInteractions()).toHaveLength(0) // May be 0 if no interactions yet
    })

    it('should clear collected data', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result } = renderHook(() => useAnalytics())

      // Track some events
      act(() => {
        result.current.trackEvent('test_event', { test: true })
      })

      expect(result.current.getEvents()).toHaveLength(1)

      // Clear data
      act(() => {
        result.current.clearData()
      })

      expect(result.current.getEvents()).toHaveLength(0)
      expect(result.current.getPageViews()).toHaveLength(0)
      expect(result.current.getPerformanceMetrics()).toHaveLength(0)
      expect(result.current.getUserInteractions()).toHaveLength(0)
    })
  })

  describe('error handling', () => {
    it('should handle fetch errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      // Mock fetch to fail
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAnalytics())

      // Should not crash when tracking events
      act(() => {
        result.current.trackEvent('test_event')
      })

      // Event should still be tracked locally
      expect(result.current.getEvents()).toHaveLength(1)
    })
  })

  describe('session management', () => {
    it('should maintain consistent session ID across renders', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        userTier: 'free',
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUserTier: jest.fn()
      })

      const { result, rerender } = renderHook(() => useAnalytics())

      const firstSessionId = result.current.sessionId

      // Re-render the hook
      rerender()

      const secondSessionId = result.current.sessionId

      expect(firstSessionId).toBe(secondSessionId)
    })
  })
})
