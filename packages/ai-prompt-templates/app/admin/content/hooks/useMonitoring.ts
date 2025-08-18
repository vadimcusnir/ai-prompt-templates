import { useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'

interface MetricData {
  name: string
  value: number
  unit?: string
  tags?: Record<string, string>
  timestamp: string
}

interface EventData {
  name: string
  category: string
  action: string
  label?: string
  value?: number
  properties?: Record<string, any>
  timestamp: string
}

interface PerformanceData {
  type: 'navigation' | 'resource' | 'paint' | 'measure'
  name: string
  value: number
  startTime?: number
  duration?: number
  timestamp: string
}

interface MonitoringConfig {
  enableMetrics: boolean
  enableEvents: boolean
  enablePerformance: boolean
  enableUserTracking: boolean
  batchSize: number
  flushInterval: number
  endpoint: string
}

export const useMonitoring = (config?: Partial<MonitoringConfig>) => {
  const { user } = useAuth()
  
  const defaultConfig: MonitoringConfig = {
    enableMetrics: true,
    enableEvents: true,
    enablePerformance: true,
    enableUserTracking: true,
    batchSize: 50,
    flushInterval: 10000, // 10 seconds
    endpoint: '/api/monitoring'
  }

  const finalConfig = { ...defaultConfig, ...config }
  const metricsRef = useRef<MetricData[]>([])
  const eventsRef = useRef<EventData[]>([])
  const performanceRef = useRef<PerformanceData[]>([])
  const flushTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Generate unique ID
  const generateId = useCallback(() => {
    return `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Record metric
  const recordMetric = useCallback((name: string, value: number, unit?: string, tags?: Record<string, string>) => {
    if (!finalConfig.enableMetrics) return

    const metric: MetricData = {
      name,
      value,
      unit,
      tags: {
        ...tags,
        userId: user?.id || 'anonymous',
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      },
      timestamp: new Date().toISOString()
    }

    metricsRef.current.push(metric)

    if (metricsRef.current.length >= finalConfig.batchSize) {
      flushMetrics()
    }
  }, [finalConfig, user])

  // Record event
  const recordEvent = useCallback((
    name: string, 
    category: string, 
    action: string, 
    label?: string, 
    value?: number, 
    properties?: Record<string, any>
  ) => {
    if (!finalConfig.enableEvents) return

    const event: EventData = {
      name,
      category,
      action,
      label,
      value,
      properties: {
        ...properties,
        userId: user?.id || 'anonymous',
        sessionId: sessionStorage.getItem('sessionId') || 'unknown',
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      timestamp: new Date().toISOString()
    }

    eventsRef.current.push(event)

    if (eventsRef.current.length >= finalConfig.batchSize) {
      flushEvents()
    }
  }, [finalConfig, user])

  // Record performance data
  const recordPerformance = useCallback((
    type: PerformanceData['type'],
    name: string,
    value: number,
    startTime?: number,
    duration?: number
  ) => {
    if (!finalConfig.enablePerformance) return

    const performance: PerformanceData = {
      type,
      name,
      value,
      startTime,
      duration,
      timestamp: new Date().toISOString()
    }

    performanceRef.current.push(performance)

    if (performanceRef.current.length >= finalConfig.batchSize) {
      flushPerformance()
    }
  }, [finalConfig])

  // User interaction tracking
  const trackUserInteraction = useCallback((
    element: string,
    action: 'click' | 'hover' | 'focus' | 'blur',
    properties?: Record<string, any>
  ) => {
    if (!finalConfig.enableUserTracking) return

    recordEvent(
      'user_interaction',
      'ui',
      action,
      element,
      undefined,
      { element, ...properties }
    )
  }, [finalConfig, recordEvent])

  // Page view tracking
  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    recordEvent(
      'page_view',
      'navigation',
      'view',
      page,
      undefined,
      { page, referrer: document.referrer, ...properties }
    )
  }, [recordEvent])

  // Error tracking
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    recordEvent(
      'error',
      'error',
      'occurred',
      error.message,
      undefined,
      {
        error: error.message,
        stack: error.stack,
        ...context
      }
    )
  }, [recordEvent])

  // Performance monitoring
  const startPerformanceTimer = useCallback((name: string) => {
    if (!finalConfig.enablePerformance) return () => {}

    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      recordPerformance('measure', name, duration, startTime, duration)
    }
  }, [finalConfig, recordPerformance])

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      recordMetric('memory_usage', memory.usedJSHeapSize, 'bytes', { type: 'used' })
      recordMetric('memory_total', memory.totalJSHeapSize, 'bytes', { type: 'total' })
      recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes', { type: 'limit' })
    }
  }, [recordMetric])

  // Network performance tracking
  const trackNetworkPerformance = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        recordMetric('network_type', connection.effectiveType === '4g' ? 4 : 3, undefined, { 
          type: connection.effectiveType 
        })
        recordMetric('network_rtt', connection.rtt, 'ms', { type: 'rtt' })
        recordMetric('network_downlink', connection.downlink, 'Mbps', { type: 'downlink' })
      }
    }
  }, [recordMetric])

  // Flush functions
  const flushMetrics = useCallback(async () => {
    if (metricsRef.current.length === 0) return

    try {
      const metricsToFlush = [...metricsRef.current]
      metricsRef.current = []

      await fetch(`${finalConfig.endpoint}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToFlush })
      })
    } catch (error) {
      console.error('Failed to flush metrics:', error)
    }
  }, [finalConfig.endpoint])

  const flushEvents = useCallback(async () => {
    if (eventsRef.current.length === 0) return

    try {
      const eventsToFlush = [...eventsRef.current]
      eventsRef.current = []

      await fetch(`${finalConfig.endpoint}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToFlush })
      })
    } catch (error) {
      console.error('Failed to flush events:', error)
    }
  }, [finalConfig.endpoint])

  const flushPerformance = useCallback(async () => {
    if (performanceRef.current.length === 0) return

    try {
      const performanceToFlush = [...performanceRef.current]
      performanceRef.current = []

      await fetch(`${finalConfig.endpoint}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performance: performanceToFlush })
      })
    } catch (error) {
      console.error('Failed to flush performance data:', error)
    }
  }, [finalConfig.endpoint])

  // Auto-flush
  useEffect(() => {
    if (finalConfig.flushInterval > 0) {
      flushTimeoutRef.current = setInterval(() => {
        flushMetrics()
        flushEvents()
        flushPerformance()
      }, finalConfig.flushInterval)
    }

    return () => {
      if (flushTimeoutRef.current) {
        clearInterval(flushTimeoutRef.current)
      }
      // Flush remaining data on unmount
      flushMetrics()
      flushEvents()
      flushPerformance()
    }
  }, [flushMetrics, flushEvents, flushPerformance, finalConfig.flushInterval])

  // Initialize session tracking
  useEffect(() => {
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', generateId())
    }

    // Track initial page view
    trackPageView(window.location.pathname)

    // Track memory and network performance
    trackMemoryUsage()
    trackNetworkPerformance()

    // Set up performance observer
    if (finalConfig.enablePerformance && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            recordPerformance('navigation', 'page_load', navEntry.loadEventEnd - navEntry.loadEventStart)
          }
        })
      })

      observer.observe({ entryTypes: ['navigation'] })

      return () => observer.disconnect()
    }
  }, [finalConfig.enablePerformance, generateId, trackPageView, trackMemoryUsage, trackNetworkPerformance, recordPerformance])

  return {
    recordMetric,
    recordEvent,
    recordPerformance,
    trackUserInteraction,
    trackPageView,
    trackError,
    startPerformanceTimer,
    trackMemoryUsage,
    trackNetworkPerformance,
    flushMetrics,
    flushEvents,
    flushPerformance
  }
}
