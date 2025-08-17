'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

interface PageViewEvent {
  path: string
  title: string
  referrer?: string
  timestamp: number
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

interface UserInteraction {
  element: string
  action: string
  properties?: Record<string, any>
  timestamp: number
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private pageViews: PageViewEvent[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private userInteractions: UserInteraction[] = []
  private sessionId: string
  private isInitialized: boolean = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initialize()
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private initialize(): void {
    if (this.isInitialized) return

    // Track page load performance
    if (typeof window !== 'undefined') {
      this.trackPageLoadPerformance()
      this.trackUserInteractions()
      this.setupVisibilityChangeTracking()
    }

    this.isInitialized = true
  }

  private trackPageLoadPerformance(): void {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            this.recordPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms')
            this.recordPerformanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms')
            this.recordPerformanceMetric('first_paint', performance.getEntriesByName('first-paint')[0]?.startTime || 0, 'ms')
            this.recordPerformanceMetric('first_contentful_paint', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, 'ms')
          }
        }, 0)
      })
    }
  }

  private trackUserInteractions(): void {
    if (typeof window !== 'undefined') {
      // Track clicks
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (target) {
          this.recordUserInteraction(
            target.tagName.toLowerCase(),
            'click',
            {
              text: target.textContent?.substring(0, 50),
              className: target.className,
              id: target.id,
              href: (target as HTMLAnchorElement).href
            }
          )
        }
      })

      // Track form submissions
      document.addEventListener('submit', (e) => {
        const form = e.target as HTMLFormElement
        this.recordUserInteraction(
          'form',
          'submit',
          {
            action: form.action,
            method: form.method,
            formId: form.id || form.name
          }
        )
      })

      // Track scroll depth
      let maxScrollDepth = 0
      document.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollDepth = Math.round((scrollTop / scrollHeight) * 100)
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth
          if (scrollDepth % 25 === 0) { // Track at 25%, 50%, 75%, 100%
            this.recordUserInteraction('page', 'scroll_depth', { depth: scrollDepth })
          }
        }
      })
    }
  }

  private setupVisibilityChangeTracking(): void {
    if (typeof document !== 'undefined') {
      let hiddenTime = 0
      let visibleTime = Date.now()

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          hiddenTime = Date.now()
          this.recordUserInteraction('page', 'hidden', { visibleDuration: hiddenTime - visibleTime })
        } else {
          visibleTime = Date.now()
          this.recordUserInteraction('page', 'visible', { hiddenDuration: visibleTime - hiddenTime })
        }
      })
    }
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId
    }

    this.events.push(analyticsEvent)
    this.sendToAnalytics(analyticsEvent)

    logger.info('Analytics event tracked', { event, properties })
  }

  trackPageView(path: string, title: string, referrer?: string): void {
    const pageView: PageViewEvent = {
      path,
      title,
      referrer: referrer || document.referrer,
      timestamp: Date.now()
    }

    this.pageViews.push(pageView)
    this.sendPageViewToAnalytics(pageView)

    logger.info('Page view tracked', { path, title, referrer })
  }

  recordPerformanceMetric(name: string, value: number, unit: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    }

    this.performanceMetrics.push(metric)
    this.sendPerformanceMetricToAnalytics(metric)
  }

  recordUserInteraction(element: string, action: string, properties?: Record<string, any>): void {
    const interaction: UserInteraction = {
      element,
      action,
      properties,
      timestamp: Date.now()
    }

    this.userInteractions.push(interaction)
    this.sendUserInteractionToAnalytics(interaction)
  }

  private async sendToAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to internal analytics endpoint
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      logger.error('Failed to send analytics event', { error, event })
    }
  }

  private async sendPageViewToAnalytics(pageView: PageViewEvent): Promise<void> {
    try {
      await fetch('/api/analytics/pageviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageView)
      })
    } catch (error) {
      logger.error('Failed to send page view analytics', { error, pageView })
    }
  }

  private async sendPerformanceMetricToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      logger.error('Failed to send performance metric', { error, metric })
    }
  }

  getSessionId(): string {
    return this.sessionId
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  getPageViews(): PageViewEvent[] {
    return [...this.pageViews]
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics]
  }

  getUserInteractions(): UserInteraction[] {
    return [...this.userInteractions]
  }

  clearData(): void {
    this.events = []
    this.pageViews = []
    this.performanceMetrics = []
    this.userInteractions = []
  }
}

// Global analytics instance
const analyticsService = new AnalyticsService()

export function useAnalytics() {
  const { user } = useAuth()
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!isInitialized.current) {
      // Track initial page view
      analyticsService.trackPageView(
        window.location.pathname,
        document.title,
        document.referrer
      )
      isInitialized.current = true
    }
  }, [])

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    analyticsService.trackEvent(event, {
      ...properties,
      userId: user?.id,
      userTier: user ? 'authenticated' : 'anonymous'
    })
  }, [user])

  const trackPageView = useCallback((path: string, title: string) => {
    analyticsService.trackPageView(path, title)
  }, [])

  const trackConversion = useCallback((funnel: string, step: string, properties?: Record<string, any>) => {
    analyticsService.trackEvent('conversion', {
      funnel,
      step,
      ...properties
    })
  }, [])

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analyticsService.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context
    })
  }, [])

  const trackSearch = useCallback((query: string, results: number, filters?: Record<string, any>) => {
    analyticsService.trackEvent('search', {
      query,
      results,
      filters
    })
  }, [])

  const trackNeuronInteraction = useCallback((neuronId: string, action: string, properties?: Record<string, any>) => {
    analyticsService.trackEvent('neuron_interaction', {
      neuronId,
      action,
      ...properties
    })
  }, [])

  const trackUserEngagement = useCallback((action: string, properties?: Record<string, any>) => {
    analyticsService.trackEvent('user_engagement', {
      action,
      ...properties
    })
  }, [])

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackError,
    trackSearch,
    trackNeuronInteraction,
    trackUserEngagement,
    sessionId: analyticsService.getSessionId(),
    getEvents: analyticsService.getEvents.bind(analyticsService),
    getPageViews: analyticsService.getPageViews.bind(analyticsService),
    getPerformanceMetrics: analyticsService.getPerformanceMetrics.bind(analyticsService),
    getUserInteractions: analyticsService.getUserInteractions.bind(analyticsService),
    clearData: analyticsService.clearData.bind(analyticsService)
  }
}
