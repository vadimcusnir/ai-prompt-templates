'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { logger, logPerformance } from '@/lib/analytics'

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  
  // Custom metrics
  componentMountTime: number
  renderTime: number
  interactionTime: number
  
  // Memory usage
  memoryUsage: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null
  
  // Network metrics
  networkInfo: {
    effectiveType: string
    downlink: number
    rtt: number
  } | null
}

export interface PerformanceThresholds {
  fcp: number // 1.8s
  lcp: number // 2.5s
  fid: number // 100ms
  cls: number // 0.1
  ttfb: number // 800ms
}

export interface UsePerformanceMonitorOptions {
  enabled?: boolean
  thresholds?: Partial<PerformanceThresholds>
  reportToAnalytics?: boolean
  logToConsole?: boolean
  onThresholdExceeded?: (metric: keyof PerformanceMetrics, value: number, threshold: number) => void
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  ttfb: 800,
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enabled = true,
    thresholds = {},
    reportToAnalytics = true,
    logToConsole = false,
    onThresholdExceeded
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    componentMountTime: 0,
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: null,
    networkInfo: null,
  })

  const [isMonitoring, setIsMonitoring] = useState(false)
  const mountStartTime = useRef<number>(Date.now())
  const renderStartTime = useRef<number>(Date.now())
  const observerRef = useRef<PerformanceObserver | null>(null)
  const lcpObserverRef = useRef<PerformanceObserver | null>(null)
  const clsObserverRef = useRef<PerformanceObserver | null>(null)

  // Final thresholds with defaults
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }

  // Measure component mount time
  useEffect(() => {
    if (!enabled) return

    const mountTime = Date.now() - mountStartTime.current
    setMetrics(prev => ({ ...prev, componentMountTime: mountTime }))

    if (logToConsole) {
      console.log(`Component mounted in ${mountTime}ms`)
    }

    // Report to analytics if enabled
    if (reportToAnalytics) {
      logPerformance('component_mount', { mountTime })
    }
  }, [enabled, reportToAnalytics, logToConsole])

  // Measure render time
  const measureRenderTime = useCallback(() => {
    const renderTime = Date.now() - renderStartTime.current
    setMetrics(prev => ({ ...prev, renderTime }))

    if (logToConsole) {
      console.log(`Component rendered in ${renderTime}ms`)
    }

    if (reportToAnalytics) {
      logPerformance('component_render', { renderTime })
    }

    // Check threshold
    if (onThresholdExceeded && renderTime > 100) { // 100ms threshold for render
      onThresholdExceeded('renderTime', renderTime, 100)
    }
  }, [reportToAnalytics, logToConsole, onThresholdExceeded])

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    if (!enabled || isMonitoring) return

    setIsMonitoring(true)
    renderStartTime.current = Date.now()

    try {
      // Monitor First Contentful Paint
      if ('PerformanceObserver' in window) {
        observerRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              const fcp = entry.startTime
              setMetrics(prev => ({ ...prev, fcp }))

              if (logToConsole) {
                console.log(`FCP: ${fcp}ms`)
              }

              if (reportToAnalytics) {
                logPerformance('fcp', { fcp })
              }

              // Check threshold
              if (fcp > finalThresholds.fcp && onThresholdExceeded) {
                onThresholdExceeded('fcp', fcp, finalThresholds.fcp)
              }
            }
          })
        })

        observerRef.current.observe({ entryTypes: ['paint'] })
      }

      // Monitor Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        lcpObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            const lcp = lastEntry.startTime
            setMetrics(prev => ({ ...prev, lcp }))

            if (logToConsole) {
              console.log(`LCP: ${lcp}ms`)
            }

            if (reportToAnalytics) {
              logPerformance('lcp', { lcp })
            }

            if (lcp > finalThresholds.lcp && onThresholdExceeded) {
              onThresholdExceeded('lcp', lcp, finalThresholds.lcp)
            }
          }
        })

        lcpObserverRef.current.observe({ entryTypes: ['largest-contentful-paint'] })
      }

      // Monitor Cumulative Layout Shift
      if ('PerformanceObserver' in window) {
        clsObserverRef.current = new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          
          setMetrics(prev => ({ ...prev, cls: clsValue }))

          if (logToConsole) {
            console.log(`CLS: ${clsValue}`)
          }

          if (reportToAnalytics) {
            logPerformance('cls', { cls: clsValue })
          }

          if (clsValue > finalThresholds.cls && onThresholdExceeded) {
            onThresholdExceeded('cls', clsValue, finalThresholds.cls)
          }
        })

        clsObserverRef.current.observe({ entryTypes: ['layout-shift'] })
      }

      // Monitor First Input Delay
      if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            const fid = entry.processingStart - entry.startTime
            setMetrics(prev => ({ ...prev, fid }))

            if (logToConsole) {
              console.log(`FID: ${fid}ms`)
            }

            if (reportToAnalytics) {
              logPerformance('fid', { fid })
            }

            if (fid > finalThresholds.fid && onThresholdExceeded) {
              onThresholdExceeded('fid', fid, finalThresholds.fid)
            }
          })
        })

        fidObserver.observe({ entryTypes: ['first-input'] })
      }

      // Get TTFB from navigation timing
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart
          setMetrics(prev => ({ ...prev, ttfb }))

          if (logToConsole) {
            console.log(`TTFB: ${ttfb}ms`)
          }

          if (reportToAnalytics) {
            logPerformance('ttfb', { ttfb })
          }

          if (ttfb > finalThresholds.ttfb && onThresholdExceeded) {
            onThresholdExceeded('ttfb', ttfb, finalThresholds.ttfb)
          }
        }
      }

      // Monitor memory usage
      if ('memory' in performance) {
        const updateMemoryInfo = () => {
          const memory = (performance as any).memory
          setMetrics(prev => ({
            ...prev,
            memoryUsage: {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
            }
          }))
        }

        updateMemoryInfo()
        // Update memory info every 5 seconds
        const memoryInterval = setInterval(updateMemoryInfo, 5000)

        return () => clearInterval(memoryInterval)
      }

      // Monitor network information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setMetrics(prev => ({
          ...prev,
          networkInfo: {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          }
        }))
      }

    } catch (error) {
      logger.error('Failed to start performance monitoring', { error })
    }
  }, [enabled, isMonitoring, finalThresholds, reportToAnalytics, logToConsole, onThresholdExceeded])

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (lcpObserverRef.current) {
      lcpObserverRef.current.disconnect()
      lcpObserverRef.current = null
    }
    if (clsObserverRef.current) {
      clsObserverRef.current.disconnect()
      clsObserverRef.current = null
    }
    setIsMonitoring(false)
  }, [])

  // Measure interaction time
  const measureInteraction = useCallback((interactionName: string) => {
    const interactionTime = Date.now() - renderStartTime.current
    setMetrics(prev => ({ ...prev, interactionTime }))

    if (logToConsole) {
      console.log(`${interactionName} interaction took ${interactionTime}ms`)
    }

    if (reportToAnalytics) {
      logPerformance('interaction', { interactionName, interactionTime })
    }

    // Reset render start time for next interaction
    renderStartTime.current = Date.now()
  }, [reportToAnalytics, logToConsole])

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    let score = 100
    let issues = 0

    if (metrics.fcp && metrics.fcp > finalThresholds.fcp) {
      score -= 20
      issues++
    }
    if (metrics.lcp && metrics.lcp > finalThresholds.lcp) {
      score -= 25
      issues++
    }
    if (metrics.fid && metrics.fid > finalThresholds.fid) {
      score -= 15
      issues++
    }
    if (metrics.cls && metrics.cls > finalThresholds.cls) {
      score -= 20
      issues++
    }
    if (metrics.ttfb && metrics.ttfb > finalThresholds.ttfb) {
      score -= 20
      issues++
    }

    return { score: Math.max(0, score), issues }
  }, [metrics, finalThresholds])

  // Start monitoring on mount
  useEffect(() => {
    if (enabled) {
      startMonitoring()
    }

    return () => {
      stopMonitoring()
    }
  }, [enabled, startMonitoring, stopMonitoring])

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureRenderTime,
    measureInteraction,
    getPerformanceScore,
    thresholds: finalThresholds,
  }
}
