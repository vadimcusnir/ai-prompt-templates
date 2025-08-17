import { useCallback, useRef, useEffect } from 'react'
import { logError, logInfo, logWarn } from '@/lib/logger'

interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
  timestamp: string
  component: string
  userId?: string
  sessionId: string
}

interface LoggerConfig {
  enableConsole: boolean
  enableRemote: boolean
  enablePerformance: boolean
  maxEntries: number
  flushInterval: number
}

export const useLogger = (componentName: string, config?: Partial<LoggerConfig>) => {
  const defaultConfig: LoggerConfig = {
    enableConsole: true,
    enableRemote: true,
    enablePerformance: true,
    maxEntries: 1000,
    flushInterval: 30000 // 30 seconds
  }

  const finalConfig = { ...defaultConfig, ...config }
  const logsRef = useRef<LogEntry[]>([])
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const flushTimeoutRef = useRef<NodeJS.Timeout>()

  // Generate unique log ID
  const generateLogId = useCallback(() => {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Add log entry
  const addLogEntry = useCallback((level: LogEntry['level'], message: string, data?: any) => {
    const logEntry: LogEntry = {
      id: generateLogId(),
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component: componentName,
      sessionId: sessionIdRef.current
    }

    logsRef.current.push(logEntry)

    // Keep only max entries
    if (logsRef.current.length > finalConfig.maxEntries) {
      logsRef.current = logsRef.current.slice(-finalConfig.maxEntries)
    }

    // Console logging
    if (finalConfig.enableConsole) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'
      console[consoleMethod](`[${componentName}] ${message}`, data || '')
    }

    // Remote logging
    if (finalConfig.enableRemote) {
      switch (level) {
        case 'error':
          logError(message, { ...data, component: componentName, sessionId: sessionIdRef.current })
          break
        case 'warn':
          logWarn(message, { ...data, component: componentName, sessionId: sessionIdRef.current })
          break
        case 'info':
          logInfo(message, { ...data, component: componentName, sessionId: sessionIdRef.current })
          break
      }
    }
  }, [componentName, finalConfig, generateLogId])

  // Log methods
  const info = useCallback((message: string, data?: any) => {
    addLogEntry('info', message, data)
  }, [addLogEntry])

  const warn = useCallback((message: string, data?: any) => {
    addLogEntry('warn', message, data)
  }, [addLogEntry])

  const error = useCallback((message: string, data?: any) => {
    addLogEntry('error', message, data)
  }, [addLogEntry])

  const debug = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      addLogEntry('debug', message, data)
    }
  }, [addLogEntry])

  // Performance logging
  const time = useCallback((label: string) => {
    if (finalConfig.enablePerformance) {
      console.time(`[${componentName}] ${label}`)
      return () => console.timeEnd(`[${componentName}] ${label}`)
    }
    return () => {}
  }, [componentName, finalConfig.enablePerformance])

  // Flush logs to remote service
  const flushLogs = useCallback(async () => {
    if (logsRef.current.length === 0 || !finalConfig.enableRemote) return

    try {
      const logsToFlush = [...logsRef.current]
      logsRef.current = []

      await fetch('/api/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: logsToFlush,
          sessionId: sessionIdRef.current,
          component: componentName
        })
      })
    } catch (error) {
      console.error('Failed to flush logs:', error)
      // Restore logs if flush failed
      logsRef.current = [...logsRef.current, ...logsRef.current]
    }
  }, [componentName, finalConfig.enableRemote])

  // Get logs
  const getLogs = useCallback(() => {
    return [...logsRef.current]
  }, [])

  // Clear logs
  const clearLogs = useCallback(() => {
    logsRef.current = []
  }, [])

  // Get session ID
  const getSessionId = useCallback(() => {
    return sessionIdRef.current
  }, [])

  // Auto-flush logs
  useEffect(() => {
    if (finalConfig.enableRemote && finalConfig.flushInterval > 0) {
      flushTimeoutRef.current = setInterval(flushLogs, finalConfig.flushInterval)
    }

    return () => {
      if (flushTimeoutRef.current) {
        clearInterval(flushTimeoutRef.current)
      }
      // Flush remaining logs on unmount
      flushLogs()
    }
  }, [flushLogs, finalConfig.enableRemote, finalConfig.flushInterval])

  return {
    info,
    warn,
    error,
    debug,
    time,
    getLogs,
    clearLogs,
    getSessionId,
    flushLogs
  }
}
