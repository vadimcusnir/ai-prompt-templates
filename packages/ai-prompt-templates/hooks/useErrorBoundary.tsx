'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAnalytics } from './useAnalytics'

interface ErrorInfo {
  error: Error
  errorInfo: React.ErrorInfo | null
  timestamp: number
  componentStack: string
  url: string
  userAgent: string
  userId?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
  lastErrorTime: number
}

interface ErrorRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  autoRecover?: boolean
  logToConsole?: boolean
  sendToAnalytics?: boolean
}

export function useErrorBoundary(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoRecover = true,
    logToConsole = true,
    sendToAnalytics = true
  } = options

  const { trackError } = useAnalytics()
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    lastErrorTime: 0
  })

  const retryCountRef = useRef(0)
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const errorHistoryRef = useRef<ErrorInfo[]>([])

  const logError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    const errorData: ErrorInfo = {
      error,
      errorInfo: errorInfo || null,
      timestamp: Date.now(),
      componentStack: errorInfo?.componentStack || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId: undefined // Will be set by analytics
    }

    errorHistoryRef.current.push(errorData)

    // Keep only last 10 errors
    if (errorHistoryRef.current.length > 10) {
      errorHistoryRef.current = errorHistoryRef.current.slice(-10)
    }

    if (logToConsole) {
      console.error('Error Boundary caught an error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo?.componentStack)
    }

    if (sendToAnalytics) {
      trackError(error, {
        componentStack: errorInfo?.componentStack,
        url: errorData.url,
        userAgent: errorData.userAgent,
        errorCount: state.errorCount + 1
      })
    }

    // Log to server if available
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(() => {
        // Silently fail if error logging fails
      })
    }
  }, [logToConsole, sendToAnalytics, trackError, state.errorCount])

  const handleError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    const now = Date.now()
    const timeSinceLastError = now - state.lastErrorTime

    // Rate limiting: don't log errors too frequently
    if (timeSinceLastError < 1000) {
      return
    }

    setState(prev => ({
      hasError: true,
      error,
      errorInfo: errorInfo || null,
      errorCount: prev.errorCount + 1,
      lastErrorTime: now
    }))

    logError(error, errorInfo)

    // Auto-recovery logic
    if (autoRecover && retryCountRef.current < maxRetries) {
      recoveryTimeoutRef.current = setTimeout(() => {
        attemptRecovery()
      }, retryDelay)
    }
  }, [state.lastErrorTime, autoRecover, maxRetries, retryDelay, logError])

  const attemptRecovery = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      return
    }

    retryCountRef.current++
    
    try {
      setState(prev => ({
        ...prev,
        hasError: false,
        error: null,
        errorInfo: null
      }))

      // Force a re-render
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('error-recovery'))
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError)
      setState(prev => ({
        ...prev,
        hasError: true,
        error: recoveryError instanceof Error ? recoveryError : new Error('Recovery failed')
      }))
    }
  }, [maxRetries])

  const resetError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    })
    retryCountRef.current = 0
    
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }
  }, [])

  const forceRecovery = useCallback(() => {
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }
    attemptRecovery()
  }, [attemptRecovery])

  const getErrorHistory = useCallback(() => {
    return [...errorHistoryRef.current]
  }, [])

  const clearErrorHistory = useCallback(() => {
    errorHistoryRef.current = []
  }, [])

  const getErrorStats = useCallback(() => {
    const now = Date.now()
    const last24h = errorHistoryRef.current.filter(
      error => now - error.timestamp < 24 * 60 * 60 * 1000
    )
    const lastHour = errorHistoryRef.current.filter(
      error => now - error.timestamp < 60 * 60 * 1000
    )

    return {
      totalErrors: errorHistoryRef.current.length,
      errorsLast24h: last24h.length,
      errorsLastHour: lastHour.length,
      currentErrorCount: state.errorCount,
      lastErrorTime: state.lastErrorTime,
      retryCount: retryCountRef.current
    }
  }, [state.errorCount, state.lastErrorTime])

  // Global error handler
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Don't handle errors from error boundaries to avoid infinite loops
      if (event.error?.message?.includes('Error Boundary')) {
        return
      }

      const error = event.error || new Error(event.message || 'Unknown error')
      handleError(error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      handleError(error)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleGlobalError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleGlobalError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }
  }, [handleError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [])

  // Error boundary component wrapper
  const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
    if (state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          {state.error && (
            <details>
              <summary>Error Details</summary>
              <pre>{state.error.message}</pre>
              {state.errorInfo?.componentStack && (
                <pre>{state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
          <div className="error-actions">
            <button onClick={forceRecovery}>Try Again</button>
            <button onClick={resetError}>Reset</button>
            <button onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      )
    }

    return <>{children}</>
  }

  return {
    // State
    hasError: state.hasError,
    error: state.error,
    errorInfo: state.errorInfo,
    errorCount: state.errorCount,
    
    // Actions
    handleError,
    resetError,
    forceRecovery,
    attemptRecovery,
    
    // Utilities
    getErrorHistory,
    clearErrorHistory,
    getErrorStats,
    
    // Component
    ErrorBoundaryWrapper
  }
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: ErrorRecoveryOptions = {}
) {
  return function ErrorBoundaryWrappedComponent(props: P) {
    const { ErrorBoundaryWrapper } = useErrorBoundary(options)
    
    return (
      <ErrorBoundaryWrapper>
        <Component {...props} />
      </ErrorBoundaryWrapper>
    )
  }
}

// Hook for components to report errors
export function useErrorReporter() {
  const { trackError } = useAnalytics()

  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    trackError(error, context)
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', error, context)
    }
  }, [trackError])

  const reportWarning = useCallback((message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning reported:', message, context)
    }
  }, [])

  return {
    reportError,
    reportWarning
  }
}
