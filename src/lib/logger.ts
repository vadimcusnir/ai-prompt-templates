// Logger securizat pentru production
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // În production, logăm doar ERROR și WARN
    if (this.isProduction) {
      return level === LogLevel.ERROR || level === LogLevel.WARN
    }
    
    return true
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase()
    const message = entry.message
    const context = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
    const error = entry.error ? ` | Error: ${entry.error.message}` : ''
    
    return `[${timestamp}] ${level}: ${message}${context}${error}`
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry)
    
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // În viitor, implementați integrarea cu servicii externe de logging
    // cum ar fi Sentry, LogRocket, sau propriul serviciu
    if (this.isProduction && entry.level === LogLevel.ERROR) {
      try {
        // Exemplu: trimitere către endpoint de logging
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (error) {
        // Fallback la console.error dacă logging-ul extern eșuează
        console.error('Failed to send log to external service:', error)
      }
    }
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    this.addToBuffer(entry)
    
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(entry))
    }
    
    this.sendToExternalService(entry)
  }

  warn(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context
    }

    this.addToBuffer(entry)
    
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(entry))
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context
    }

    this.addToBuffer(entry)
    
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(entry))
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      context
    }

    this.addToBuffer(entry)
    
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(entry))
    }
  }

  // Funcție pentru logging de securitate
  security(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message: `SECURITY: ${message}`,
      timestamp: new Date().toISOString(),
      context
    }

    this.addToBuffer(entry)
    
    // Logăm întotdeauna mesajele de securitate
    console.warn(this.formatMessage(entry))
    
    // Trimitem la serviciul extern pentru audit
    this.sendToExternalService(entry)
  }

  // Funcție pentru logging de performanță
  performance(operation: string, duration: number, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: `PERFORMANCE: ${operation} took ${duration}ms`,
      timestamp: new Date().toISOString(),
      context
    }

    this.addToBuffer(entry)
    
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(entry))
    }
  }

  // Funcție pentru obținerea logurilor din buffer
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level)
    }
    return [...this.logBuffer]
  }

  // Funcție pentru curățarea buffer-ului
  clearLogs() {
    this.logBuffer = []
  }

  // Funcție pentru exportul logurilor
  exportLogs(): string {
    return this.logBuffer
      .map(entry => this.formatMessage(entry))
      .join('\n')
  }
}

// Instanță globală a logger-ului
export const logger = new SecureLogger()

// Funcții helper pentru logging rapid
export const logError = (message: string, context?: Record<string, unknown>, error?: Error) => 
  logger.error(message, context, error)

export const logWarn = (message: string, context?: Record<string, unknown>) => 
  logger.warn(message, context)

export const logInfo = (message: string, context?: Record<string, unknown>) => 
  logger.info(message, context)

export const logDebug = (message: string, context?: Record<string, unknown>) => 
  logger.debug(message, context)

export const logSecurity = (message: string, context?: Record<string, unknown>) => 
  logger.security(message, context)

export const logPerformance = (operation: string, duration: number, context?: Record<string, unknown>) => 
  logger.performance(operation, duration, context)

// Funcție pentru înlocuirea console.log global
export function replaceConsoleLogs() {
  if (process.env.NODE_ENV === 'production') {
    // Înlocuim console.log cu funcția noastră de logging
    const originalConsoleLog = console.log
    const originalConsoleInfo = console.info
    const originalConsoleDebug = console.debug
    
    console.log = (...args: unknown[]) => {
      logger.info(args.join(' '))
    }
    
    console.info = (...args: unknown[]) => {
      logger.info(args.join(' '))
    }
    
    console.debug = (...args: unknown[]) => {
      logger.debug(args.join(' '))
    }
    
    // Păstrăm console.error și console.warn pentru erori critice
    // console.error = (...args: any[]) => logger.error(args.join(' '))
    // console.warn = (...args: any[]) => logger.warn(args.join(' '))
    
    // Returnăm funcțiile originale pentru a putea fi restaurate
    return {
      restore: () => {
        console.log = originalConsoleLog
        console.info = originalConsoleInfo
        console.debug = originalConsoleDebug
      }
    }
  }
  
  return { restore: () => {} }
}
