'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAnalytics } from './useAnalytics'

interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  pageLoadTime: number | null
  domContentLoaded: number | null
}

interface ResourceTiming {
  name: string
  duration: number
  size: number
  type: string
}

interface PerformanceObserver {
  observe: (options: any) => void
  disconnect: () => void
}

declare global {
  interface Window {
    PerformanceObserver: {
      new (callback: PerformanceObserverCallback): PerformanceObserver
      supportedEntryTypes: string[]
    }
  }
}

export function usePerformanceMonitor() {
  const { recordPerformanceMetric } = useAnalytics()
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    pageLoadTime: null,
    domContentLoaded: null
  })
  const observerRef = useRef<PerformanceObserver | null>(null)
  const isInitialized = useRef(false)

  const measureCoreWebVitals = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    // First Contentful Paint (FCP)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry
        if (lastEntry) {
          metricsRef.current.fcp = lastEntry.startTime
          recordPerformanceMetric('fcp', lastEntry.startTime, 'ms')
        }
      }).observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('FCP measurement failed:', e)
    }

    // Largest Contentful Paint (LCP)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry
        if (lastEntry) {
          metricsRef.current.lcp = lastEntry.startTime
          recordPerformanceMetric('lcp', lastEntry.startTime, 'ms')
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.warn('LCP measurement failed:', e)
    }

    // First Input Delay (FID)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming
            metricsRef.current.fid = fidEntry.processingStart - fidEntry.startTime
            recordPerformanceMetric('fid', metricsRef.current.fid, 'ms')
          }
        })
      }).observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('FID measurement failed:', e)
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      let clsEntries: PerformanceEntry[] = []
      
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value
            clsEntries.push(entry)
          }
        }
        metricsRef.current.cls = clsValue
        recordPerformanceMetric('cls', clsValue, 'score')
      }).observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.warn('CLS measurement failed:', e)
    }
  }, [recordPerformanceMetric])

  const measureNavigationTiming = useCallback(() => {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      // Time to First Byte
      const ttfb = navigation.responseStart - navigation.requestStart
      metricsRef.current.ttfb = ttfb
      recordPerformanceMetric('ttfb', ttfb, 'ms')

      // Page Load Time
      const pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart
      metricsRef.current.pageLoadTime = pageLoadTime
      recordPerformanceMetric('page_load_time', pageLoadTime, 'ms')

      // DOM Content Loaded
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      metricsRef.current.domContentLoaded = domContentLoaded
      recordPerformanceMetric('dom_content_loaded', domContentLoaded, 'ms')

      // Additional navigation metrics
      recordPerformanceMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms')
      recordPerformanceMetric('tcp_connection', navigation.connectEnd - navigation.connectStart, 'ms')
      recordPerformanceMetric('server_response', navigation.responseEnd - navigation.responseStart, 'ms')
      recordPerformanceMetric('dom_parsing', navigation.domComplete - navigation.domInteractive, 'ms')
    }
  }, [recordPerformanceMetric])

  const measureResourceTiming = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            const resourceName = resourceEntry.name
            const resourceType = resourceEntry.initiatorType || 'other'
            
            // Measure resource load time
            const loadTime = resourceEntry.responseEnd - resourceEntry.startTime
            recordPerformanceMetric(`resource_load_${resourceType}`, loadTime, 'ms')
            
            // Measure resource size
            if (resourceEntry.transferSize > 0) {
              recordPerformanceMetric(`resource_size_${resourceType}`, resourceEntry.transferSize, 'bytes')
            }
            
            // Track slow resources
            if (loadTime > 1000) { // Resources taking more than 1 second
              recordPerformanceMetric('slow_resource', loadTime, 'ms', {
                name: resourceName,
                type: resourceType,
                size: resourceEntry.transferSize
              })
            }
          }
        })
      }).observe({ entryTypes: ['resource'] })
    } catch (e) {
      console.warn('Resource timing measurement failed:', e)
    }
  }, [recordPerformanceMetric])

  const measureLongTasks = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            const longTaskEntry = entry as PerformanceEntry
            const duration = longTaskEntry.duration
            
            recordPerformanceMetric('long_task', duration, 'ms', {
              startTime: longTaskEntry.startTime,
              name: longTaskEntry.name || 'unknown'
            })
            
            // Alert for very long tasks
            if (duration > 100) { // Tasks longer than 100ms
              recordPerformanceMetric('critical_long_task', duration, 'ms', {
                startTime: longTaskEntry.startTime,
                name: longTaskEntry.name || 'unknown'
              })
            }
          }
        })
      }).observe({ entryTypes: ['longtask'] })
    } catch (e) {
      console.warn('Long task measurement failed:', e)
    }
  }, [recordPerformanceMetric])

  const measureMemoryUsage = useCallback(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return
    }

    const memory = (performance as any).memory
    if (memory) {
      recordPerformanceMetric('memory_used', memory.usedJSHeapSize, 'bytes')
      recordPerformanceMetric('memory_total', memory.totalJSHeapSize, 'bytes')
      recordPerformanceMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes')
      
      // Calculate memory usage percentage
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      recordPerformanceMetric('memory_usage_percentage', usagePercentage, 'percent')
      
      // Alert for high memory usage
      if (usagePercentage > 80) {
        recordPerformanceMetric('high_memory_usage', usagePercentage, 'percent')
      }
    }
  }, [recordPerformanceMetric])

  const measureNetworkInfo = useCallback(() => {
    if (typeof window === 'undefined' || !('navigator' in window)) {
      return
    }

    const connection = (navigator as any).connection
    if (connection) {
      recordPerformanceMetric('network_effective_type', connection.effectiveType === '4g' ? 4 : 
        connection.effectiveType === '3g' ? 3 : 
        connection.effectiveType === '2g' ? 2 : 1, 'score')
      
      recordPerformanceMetric('network_downlink', connection.downlink, 'Mbps')
      recordPerformanceMetric('network_rtt', connection.rtt, 'ms')
      
      // Track network changes
      connection.addEventListener('change', () => {
        recordPerformanceMetric('network_change', Date.now(), 'timestamp', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
      })
    }
  }, [recordPerformanceMetric])

  const measureUserInteractions = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    let interactionCount = 0
    let lastInteractionTime = Date.now()

    const trackInteraction = () => {
      const now = Date.now()
      const timeSinceLastInteraction = now - lastInteractionTime
      
      interactionCount++
      lastInteractionTime = now
      
      recordPerformanceMetric('user_interaction_interval', timeSinceLastInteraction, 'ms')
      recordPerformanceMetric('total_interactions', interactionCount, 'count')
    }

    // Track various user interactions
    document.addEventListener('click', trackInteraction, { passive: true })
    document.addEventListener('keydown', trackInteraction, { passive: true })
    document.addEventListener('scroll', trackInteraction, { passive: true })
    document.addEventListener('touchstart', trackInteraction, { passive: true })
  }, [recordPerformanceMetric])

  const getCurrentMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current }
  }, [])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      pageLoadTime: null,
      domContentLoaded: null
    }
  }, [])

  const generatePerformanceReport = useCallback(() => {
    const metrics = getCurrentMetrics()
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics,
      summary: {
        fcpScore: metrics.fcp && metrics.fcp < 1800 ? 'good' : metrics.fcp && metrics.fcp < 3000 ? 'needs_improvement' : 'poor',
        lcpScore: metrics.lcp && metrics.lcp < 2500 ? 'good' : metrics.lcp && metrics.lcp < 4000 ? 'needs_improvement' : 'poor',
        fidScore: metrics.fid && metrics.fid < 100 ? 'good' : metrics.fid && metrics.fid < 300 ? 'needs_improvement' : 'poor',
        clsScore: metrics.cls && metrics.cls < 0.1 ? 'good' : metrics.cls && metrics.cls < 0.25 ? 'needs_improvement' : 'poor'
      }
    }
    
    return report
  }, [getCurrentMetrics])

  useEffect(() => {
    if (isInitialized.current) return

    // Wait for page to load before measuring
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        measureCoreWebVitals()
        measureNavigationTiming()
        measureResourceTiming()
        measureLongTasks()
        measureMemoryUsage()
        measureNetworkInfo()
        measureUserInteractions()
      })
    } else {
      measureCoreWebVitals()
      measureNavigationTiming()
      measureResourceTiming()
      measureLongTasks()
      measureMemoryUsage()
      measureNetworkInfo()
      measureUserInteractions()
    }

    isInitialized.current = true

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [
    measureCoreWebVitals,
    measureNavigationTiming,
    measureResourceTiming,
    measureLongTasks,
    measureMemoryUsage,
    measureNetworkInfo,
    measureUserInteractions
  ])

  return {
    getCurrentMetrics,
    resetMetrics,
    generatePerformanceReport,
    metrics: metricsRef.current
  }
}
