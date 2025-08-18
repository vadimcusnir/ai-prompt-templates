import { useEffect, useRef, useCallback } from 'react'
import { PERFORMANCE_METRICS } from '../config/performance'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  errorCount: number
  fetchTime: number
}

export const usePerformanceMonitor = () => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    errorCount: 0,
    fetchTime: 0
  })

  const startRenderTimer = useCallback(() => {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      metricsRef.current.renderTime = renderTime
      
      if (renderTime > PERFORMANCE_METRICS.SLOW_RENDER_THRESHOLD) {
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [])

  const startFetchTimer = useCallback(() => {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const fetchTime = endTime - startTime
      metricsRef.current.fetchTime = fetchTime
      
      if (fetchTime > PERFORMANCE_METRICS.SLOW_FETCH_THRESHOLD) {
        console.warn(`Slow fetch detected: ${fetchTime.toFixed(2)}ms`)
      }
    }
  }, [])

  const recordError = useCallback(() => {
    metricsRef.current.errorCount++
    
    if (metricsRef.current.errorCount > PERFORMANCE_METRICS.MAX_ERRORS_PER_SESSION) {
      console.error('Too many errors in session, consider refreshing the page')
    }
  }, [])

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }
    return null
  }, [])

  const checkMemoryUsage = useCallback(() => {
    const memory = getMemoryUsage()
    if (memory && memory.percentage > PERFORMANCE_METRICS.HIGH_MEMORY_THRESHOLD) {
      console.warn(`High memory usage: ${memory.percentage.toFixed(1)}%`)
    }
  }, [getMemoryUsage])

  const getMetrics = useCallback(() => {
    return {
      ...metricsRef.current,
      memory: getMemoryUsage()
    }
  }, [getMemoryUsage])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      fetchTime: 0
    }
  }, [])

  // Monitor memory usage periodically
  useEffect(() => {
    const interval = setInterval(checkMemoryUsage, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [checkMemoryUsage])

  return {
    startRenderTimer,
    startFetchTimer,
    recordError,
    getMetrics,
    resetMetrics,
    checkMemoryUsage
  }
}
