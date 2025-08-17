import { useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLogger } from './useLogger'

interface SecurityConfig {
  enableInputValidation: boolean
  enableXSSProtection: boolean
  enableCSRFProtection: boolean
  enableRateLimiting: boolean
  maxRequestSize: number
  allowedFileTypes: string[]
  maxFileSize: number
}

interface SecurityViolation {
  type: 'xss' | 'csrf' | 'injection' | 'rate_limit' | 'file_upload' | 'input_validation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: string
  timestamp: string
  userId?: string
  ip?: string
  userAgent?: string
}

export const useSecurity = (config?: Partial<SecurityConfig>) => {
  const { user } = useAuth()
  const logger = useLogger('useSecurity')
  
  const defaultConfig: SecurityConfig = {
    enableInputValidation: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    enableRateLimiting: true,
    maxRequestSize: 1024 * 1024, // 1MB
    allowedFileTypes: ['.txt', '.md', '.json'],
    maxFileSize: 100 * 1024 // 100KB
  }

  const finalConfig = { ...defaultConfig, ...config }
  const violationsRef = useRef<SecurityViolation[]>([])
  const requestCountRef = useRef<Map<string, { count: number; resetTime: number }>>(new Map())

  // XSS Protection
  const sanitizeInput = useCallback((input: string): string => {
    if (!finalConfig.enableXSSProtection) return input

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .replace(/&/g, '&amp;')
  }, [finalConfig.enableXSSProtection])

  // Input Validation
  const validateInput = useCallback((input: any, rules: {
    type: 'string' | 'number' | 'email' | 'url' | 'array'
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => boolean
  }): { isValid: boolean; errors: string[] } => {
    if (!finalConfig.enableInputValidation) return { isValid: true, errors: [] }

    const errors: string[] = []

    // Required check
    if (rules.required && (input === undefined || input === null || input === '')) {
      errors.push('Field is required')
    }

    if (input !== undefined && input !== null) {
      // Type check
      switch (rules.type) {
        case 'string':
          if (typeof input !== 'string') {
            errors.push('Field must be a string')
          } else {
            if (rules.minLength && input.length < rules.minLength) {
              errors.push(`Minimum length is ${rules.minLength} characters`)
            }
            if (rules.maxLength && input.length > rules.maxLength) {
              errors.push(`Maximum length is ${rules.maxLength} characters`)
            }
            if (rules.pattern && !rules.pattern.test(input)) {
              errors.push('Field format is invalid')
            }
          }
          break
        case 'number':
          if (typeof input !== 'number' || isNaN(input)) {
            errors.push('Field must be a valid number')
          }
          break
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (typeof input !== 'string' || !emailPattern.test(input)) {
            errors.push('Field must be a valid email address')
          }
          break
        case 'url':
          try {
            new URL(input)
          } catch {
            errors.push('Field must be a valid URL')
          }
          break
        case 'array':
          if (!Array.isArray(input)) {
            errors.push('Field must be an array')
          }
          break
      }

      // Custom validation
      if (rules.custom && !rules.custom(input)) {
        errors.push('Field failed custom validation')
      }
    }

    return { isValid: errors.length === 0, errors }
  }, [finalConfig.enableInputValidation])

  // CSRF Protection
  const validateCSRFToken = useCallback((token: string): boolean => {
    if (!finalConfig.enableCSRFProtection) return true

    const storedToken = sessionStorage.getItem('csrf_token')
    if (!storedToken || storedToken !== token) {
      logger.warn('CSRF token validation failed', { provided: token, stored: storedToken })
      return false
    }

    return true
  }, [finalConfig.enableCSRFProtection, logger])

  const generateCSRFToken = useCallback((): string => {
    const token = `csrf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('csrf_token', token)
    return token
  }, [])

  // Rate Limiting
  const checkRateLimit = useCallback((key: string, limit: number, windowMs: number): boolean => {
    if (!finalConfig.enableRateLimiting) return true

    const now = Date.now()
    const record = requestCountRef.current.get(key)

    if (!record || now > record.resetTime) {
      requestCountRef.current.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= limit) {
      logger.warn('Rate limit exceeded', { key, limit, windowMs })
      return false
    }

    record.count++
    return true
  }, [finalConfig.enableRateLimiting, logger])

  // File Upload Security
  const validateFileUpload = useCallback((file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // File size check
    if (file.size > finalConfig.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${finalConfig.maxFileSize / 1024}KB`)
    }

    // File type check
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!finalConfig.allowedFileTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not allowed`)
    }

    // File name security
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('File name contains invalid characters')
    }

    return { isValid: errors.length === 0, errors }
  }, [finalConfig.maxFileSize, finalConfig.allowedFileTypes])

  // SQL Injection Protection
  const sanitizeSQLInput = useCallback((input: string): string => {
    // Basic SQL injection patterns
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)/gi,
      /(--|#|\/\*|\*\/|;|xp_|sp_)/gi,
      /(\b(and|or)\b\s+\d+\s*[=<>])/gi
    ]

    let sanitized = input
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[BLOCKED]')
    })

    return sanitized
  }, [])

  // Security Violation Recording
  const recordViolation = useCallback((violation: Omit<SecurityViolation, 'timestamp' | 'userId'>) => {
    const fullViolation: SecurityViolation = {
      ...violation,
      timestamp: new Date().toISOString(),
      userId: user?.id
    }

    violationsRef.current.push(fullViolation)
    logger.error('Security violation detected', fullViolation)

    // Send to security monitoring system
    fetch('/api/security/violations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullViolation)
    }).catch(error => {
      logger.error('Failed to report security violation', { error: error.message })
    })
  }, [user, logger])

  // Request Security Validation
  const validateRequest = useCallback((request: {
    method: string
    url: string
    headers: Record<string, string>
    body?: any
    csrfToken?: string
  }): { isValid: boolean; violations: SecurityViolation[] } => {
    const violations: SecurityViolation[] = []

    // CSRF check for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method.toUpperCase())) {
      if (!validateCSRFToken(request.csrfToken || '')) {
        violations.push({
          type: 'csrf',
          severity: 'high',
          details: 'Invalid or missing CSRF token',
          ip: 'unknown',
          userAgent: navigator.userAgent
        })
      }
    }

    // Rate limiting check
    const rateLimitKey = `${request.method}:${request.url}:${user?.id || 'anonymous'}`
    if (!checkRateLimit(rateLimitKey, 100, 60000)) { // 100 requests per minute
      violations.push({
        type: 'rate_limit',
        severity: 'medium',
        details: 'Rate limit exceeded',
        ip: 'unknown',
        userAgent: navigator.userAgent
      })
    }

    // Request size check
    if (request.body && JSON.stringify(request.body).length > finalConfig.maxRequestSize) {
      violations.push({
        type: 'input_validation',
        severity: 'medium',
        details: 'Request body too large',
        ip: 'unknown',
        userAgent: navigator.userAgent
      })
    }

    // Record violations
    violations.forEach(violation => recordViolation(violation))

    return { isValid: violations.length === 0, violations }
  }, [validateCSRFToken, checkRateLimit, recordViolation, user, finalConfig.maxRequestSize])

  // Get security violations
  const getViolations = useCallback(() => {
    return [...violationsRef.current]
  }, [])

  // Clear violations
  const clearViolations = useCallback(() => {
    violationsRef.current = []
  }, [])

  // Security audit
  const performSecurityAudit = useCallback(() => {
    const audit = {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      violations: violationsRef.current.length,
      config: finalConfig,
      recommendations: [] as string[]
    }

    if (violationsRef.current.length > 10) {
      audit.recommendations.push('High number of security violations detected')
    }

    if (!finalConfig.enableXSSProtection) {
      audit.recommendations.push('Enable XSS protection')
    }

    if (!finalConfig.enableCSRFProtection) {
      audit.recommendations.push('Enable CSRF protection')
    }

    logger.info('Security audit completed', audit)
    return audit
  }, [user, finalConfig, logger])

  return {
    sanitizeInput,
    validateInput,
    validateCSRFToken,
    generateCSRFToken,
    checkRateLimit,
    validateFileUpload,
    sanitizeSQLInput,
    recordViolation,
    validateRequest,
    getViolations,
    clearViolations,
    performSecurityAudit
  }
}
