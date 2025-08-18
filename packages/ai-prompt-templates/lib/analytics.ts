// Analytics and monitoring system for AI Prompt Templates platform

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
  page?: string
  userAgent?: string
  referrer?: string
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  metadata?: Record<string, any>
  timestamp?: number
}

export interface UserBehavior {
  userId: string
  sessionId: string
  pageViews: string[]
  interactions: string[]
  timeOnPage: number
  scrollDepth: number
  clicks: number
}

export interface ErrorEvent {
  message: string
  stack?: string
  component?: string
  userId?: string
  sessionId?: string
  timestamp?: number
  metadata?: Record<string, any>
}

// Analytics configuration
const ANALYTICS_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics',
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000,
}

// Event queue for batching
let eventQueue: AnalyticsEvent[] = []
let performanceQueue: PerformanceMetric[] = []
let errorQueue: ErrorEvent[] = []
let flushTimer: NodeJS.Timeout | null = null

// Session management
let currentSessionId: string | null = null
let sessionStartTime: number | null = null
let pageViewCount = 0

// Performance monitoring
let performanceObserver: PerformanceObserver | null = null
let webVitals: Record<string, number> = {}

// Initialize analytics
export function initializeAnalytics(): void {
  if (typeof window === 'undefined' || !ANALYTICS_CONFIG.enabled) return

  try {
    // Generate session ID
    currentSessionId = generateSessionId()
    sessionStartTime = Date.now()

    // Start session timer
    startSessionDurationTimer()

    // Initialize performance monitoring
    initializePerformanceMonitoring()

    // Set up page visibility tracking
    setupPageVisibilityTracking()

    // Set up error tracking
    setupErrorTracking()

    // Set up user behavior tracking
    setupUserBehaviorTracking()

    // Start flush timer
    startFlushTimer()

    console.log('Analytics initialized successfully')
  } catch (error) {
    console.error('Failed to initialize analytics:', error)
  }
}

// Session management
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function startSessionDurationTimer(): void {
  if (typeof window === 'undefined') return

  // Track session duration
  setInterval(() => {
    if (sessionStartTime) {
      const sessionDuration = Date.now() - sessionStartTime
      trackEvent('session_duration', { duration: sessionDuration })
    }
  }, 60000) // Every minute
}

// Performance monitoring
function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  try {
    // Core Web Vitals
    performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          webVitals.lcp = entry.startTime
          trackPerformance('lcp', entry.startTime, 'ms')
        } else if (entry.entryType === 'first-input') {
          const fid = (entry as any).processingStart - entry.startTime
          webVitals.fid = fid
          trackPerformance('fid', fid, 'ms')
        } else if (entry.entryType === 'layout-shift') {
          if (!webVitals.cls) webVitals.cls = 0
          webVitals.cls += (entry as any).value
          trackPerformance('cls', webVitals.cls, 'score')
        }
      }
    })

    performanceObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })

    // Navigation timing
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        trackPerformance('ttfb', navigation.responseStart - navigation.requestStart, 'ms')
        trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms')
        trackPerformance('page_load', navigation.loadEventEnd - navigation.loadEventStart, 'ms')
      }
    }

    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming
        if (resourceEntry.transferSize > 0) {
          trackPerformance('resource_load', resourceEntry.responseEnd - resourceEntry.startTime, 'ms', {
            name: resourceEntry.name,
            type: resourceEntry.initiatorType || 'other',
            size: resourceEntry.transferSize
          })
        }
      }
    })

    resourceObserver.observe({ entryTypes: ['resource'] })

  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error)
  }
}

// Page visibility tracking
function setupPageVisibilityTracking(): void {
  if (typeof window === 'undefined') return

  let hiddenTime: number | null = null

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenTime = Date.now()
      trackEvent('page_hidden')
    } else {
      if (hiddenTime) {
        const hiddenDuration = Date.now() - hiddenTime
        trackEvent('page_visible', { hiddenDuration })
        hiddenTime = null
      }
    }
  })
}

// Error tracking
function setupErrorTracking(): void {
  if (typeof window === 'undefined') return

  // Global error handler
  window.addEventListener('error', (event) => {
    trackError('javascript_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack
    })
  })

  // Promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError('unhandled_promise_rejection', {
      reason: event.reason,
      promise: event.promise
    })
  })

  // React error boundary (if available)
  if (typeof window !== 'undefined') {
    (window as any).__REACT_ERROR_BOUNDARY__ = (error: Error, errorInfo: any) => {
      trackError('react_error_boundary', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }
}

// User behavior tracking
function setupUserBehaviorTracking(): void {
  if (typeof window === 'undefined') return

  let scrollDepth = 0
  let clickCount = 0
  let lastInteraction = Date.now()

  // Scroll tracking
  let scrollTimeout: NodeJS.Timeout
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      const newScrollDepth = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
      if (newScrollDepth > scrollDepth) {
        scrollDepth = newScrollDepth
        trackEvent('scroll_depth', { depth: scrollDepth })
      }
    }, 100)
  })

  // Click tracking
  document.addEventListener('click', (event) => {
    clickCount++
    const target = event.target as HTMLElement
    trackEvent('click', {
      target: target.tagName.toLowerCase(),
      className: target.className,
      id: target.id,
      text: target.textContent?.substring(0, 100)
    })
  })

  // Interaction tracking
  const trackInteraction = () => {
    const now = Date.now()
    if (now - lastInteraction > 30000) { // 30 seconds
      trackEvent('user_interaction', {
        timeSinceLastInteraction: now - lastInteraction,
        scrollDepth,
        clickCount
      })
      lastInteraction = now
    }
  }

  document.addEventListener('mousemove', trackInteraction)
  document.addEventListener('keydown', trackInteraction)
  document.addEventListener('touchstart', trackInteraction)
}

// Event tracking
export function trackEvent(name: string, properties?: Record<string, any>): void {
  if (!ANALYTICS_CONFIG.enabled) return

  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now(),
    sessionId: currentSessionId,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  }

  eventQueue.push(event)

  // Flush if queue is full
  if (eventQueue.length >= ANALYTICS_CONFIG.batchSize) {
    flushEvents()
  }
}

// Performance tracking
export function trackPerformance(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
  if (!ANALYTICS_CONFIG.enabled) return

  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    metadata,
    timestamp: Date.now(),
  }

  performanceQueue.push(metric)

  // Flush if queue is full
  if (performanceQueue.length >= ANALYTICS_CONFIG.batchSize) {
    flushPerformance()
  }
}

// Error tracking
export function trackError(message: string, metadata?: Record<string, any>): void {
  if (!ANALYTICS_CONFIG.enabled) return

  const error: ErrorEvent = {
    message,
    metadata,
    timestamp: Date.now(),
    sessionId: currentSessionId,
  }

  errorQueue.push(error)

  // Flush errors immediately
  flushErrors()
}

// Specific tracking functions
export function trackPageView(url: string, title?: string): void {
  pageViewCount++
  trackEvent('page_view', {
    url,
    title,
    pageViewCount,
    sessionId: currentSessionId
  })
}

export function trackSearch(query: string, filters?: Record<string, any>, resultsCount?: number): void {
  trackEvent('search', {
    query,
    filters,
    resultsCount,
    sessionId: currentSessionId
  })
}

export function trackNeuronInteraction(neuronId: string, action: string, metadata?: Record<string, any>): void {
  trackEvent('neuron_interaction', {
    neuronId,
    action,
    metadata,
    sessionId: currentSessionId
  })
}

export function trackCheckout(amount: number, currency: string, plan: string): void {
  trackEvent('checkout', {
    amount,
    currency,
    plan,
    sessionId: currentSessionId
  })
}

export function trackUserRegistration(method: string): void {
  trackEvent('user_registration', {
    method,
    sessionId: currentSessionId
  })
}

export function trackUserLogin(method: string): void {
  trackEvent('user_login', {
    method,
    sessionId: currentSessionId
  })
}

// Flush functions
function startFlushTimer(): void {
  if (flushTimer) clearInterval(flushTimer)
  
  flushTimer = setInterval(() => {
    flushEvents()
    flushPerformance()
  }, ANALYTICS_CONFIG.flushInterval)
}

async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return

  const events = [...eventQueue]
  eventQueue = []

  try {
    await sendAnalyticsData('events', events)
  } catch (error) {
    console.error('Failed to flush events:', error)
    // Re-queue events for retry
    eventQueue.unshift(...events)
  }
}

async function flushPerformance(): Promise<void> {
  if (performanceQueue.length === 0) return

  const metrics = [...performanceQueue]
  performanceQueue = []

  try {
    await sendAnalyticsData('performance', metrics)
  } catch (error) {
    console.error('Failed to flush performance data:', error)
    // Re-queue metrics for retry
    performanceQueue.unshift(...metrics)
  }
}

async function flushErrors(): Promise<void> {
  if (errorQueue.length === 0) return

  const errors = [...errorQueue]
  errorQueue = []

  try {
    await sendAnalyticsData('errors', errors)
  } catch (error) {
    console.error('Failed to flush errors:', error)
    // Re-queue errors for retry
    errorQueue.unshift(...errors)
  }
}

// Send data to analytics endpoint
async function sendAnalyticsData(type: string, data: any[]): Promise<void> {
  if (!ANALYTICS_CONFIG.enabled) return

  const payload = {
    type,
    data,
    timestamp: Date.now(),
    sessionId: currentSessionId,
  }

  let retries = 0
  while (retries < ANALYTICS_CONFIG.maxRetries) {
    try {
      const response = await fetch(ANALYTICS_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        return
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      retries++
      if (retries >= ANALYTICS_CONFIG.maxRetries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, ANALYTICS_CONFIG.retryDelay * retries))
    }
  }
}

// Utility functions
export function setUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('analytics_user_id', userId)
  }
}

export function getUserId(): string | null {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('analytics_user_id')
  }
  return null
}

export function startSessionTimer(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('session_start', Date.now().toString())
  }
}

export function getSessionDuration(): number {
  if (typeof window !== 'undefined') {
    const start = window.sessionStorage.getItem('session_start')
    if (start) {
      return Date.now() - parseInt(start)
    }
  }
  return 0
}

// Cleanup function
export function cleanupAnalytics(): void {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }

  if (performanceObserver) {
    performanceObserver.disconnect()
    performanceObserver = null
  }

  // Flush remaining data
  flushEvents()
  flushPerformance()
  flushErrors()
}

// Export logger for compatibility
export const logger = {
  info: (message: string, data?: any) => {
    console.info(`[Analytics] ${message}`, data)
    trackEvent('log_info', { message, data })
  },
  error: (message: string, data?: any) => {
    console.error(`[Analytics] ${message}`, data)
    trackError(message, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Analytics] ${message}`, data)
    trackEvent('log_warn', { message, data })
  },
}

// Export logPerformance for compatibility
export const logPerformance = (name: string, value: number, unit: string, metadata?: Record<string, any>) => {
  trackPerformance(name, value, unit, metadata)
}

// Initialize analytics when module is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnalytics)
  } else {
    initializeAnalytics()
  }
}
