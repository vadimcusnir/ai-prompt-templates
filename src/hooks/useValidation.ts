'use client'

import { useState, useCallback, useMemo, useRef } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  url?: boolean
  numeric?: boolean
  integer?: boolean
  positive?: boolean
  min?: number
  max?: number
  custom?: (value: any, allValues?: Record<string, any>) => string | null
  message?: string
}

interface ValidationSchema {
  [field: string]: ValidationRule | ValidationRule[]
}

interface ValidationError {
  field: string
  message: string
  value: any
}

interface ValidationState {
  errors: ValidationError[]
  isValid: boolean
  isDirty: boolean
  touched: Set<string>
  submitted: boolean
}

interface UseValidationReturn<T> {
  // State
  errors: ValidationError[]
  isValid: boolean
  isDirty: boolean
  touched: Set<string>
  submitted: boolean
  
  // Actions
  validate: (values: T, schema?: ValidationSchema) => ValidationError[]
  validateField: (field: string, value: any, schema?: ValidationSchema) => string | null
  setFieldError: (field: string, message: string) => void
  clearFieldError: (field: string) => void
  clearAllErrors: () => void
  markFieldAsTouched: (field: string) => void
  markAllFieldsAsTouched: () => void
  resetValidation: () => void
  
  // Utilities
  getFieldError: (field: string) => string | null
  hasFieldError: (field: string) => boolean
  getErrorCount: () => number
  getFirstError: () => ValidationError | null
}

// Built-in validation functions
const validators = {
  required: (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'This field is required'
    }
    return null
  },

  minLength: (value: any, min: number): string | null => {
    if (value && typeof value === 'string' && value.length < min) {
      return `Must be at least ${min} characters long`
    }
    if (Array.isArray(value) && value.length < min) {
      return `Must have at least ${min} items`
    }
    return null
  },

  maxLength: (value: any, max: number): string | null => {
    if (value && typeof value === 'string' && value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    if (Array.isArray(value) && value.length > max) {
      return `Must have no more than ${max} items`
    }
    return null
  },

  pattern: (value: any, pattern: RegExp): string | null => {
    if (value && typeof value === 'string' && !pattern.test(value)) {
      return 'Invalid format'
    }
    return null
  },

  email: (value: any): string | null => {
    if (value && typeof value === 'string') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        return 'Invalid email address'
      }
    }
    return null
  },

  url: (value: any): string | null => {
    if (value && typeof value === 'string') {
      try {
        new URL(value)
      } catch {
        return 'Invalid URL'
      }
    }
    return null
  },

  numeric: (value: any): string | null => {
    if (value && isNaN(Number(value))) {
      return 'Must be a number'
    }
    return null
  },

  integer: (value: any): string | null => {
    if (value && (!Number.isInteger(Number(value)) || isNaN(Number(value)))) {
      return 'Must be an integer'
    }
    return null
  },

  positive: (value: any): string | null => {
    if (value && Number(value) <= 0) {
      return 'Must be positive'
    }
    return null
  },

  min: (value: any, min: number): string | null => {
    if (value && Number(value) < min) {
      return `Must be at least ${min}`
    }
    return null
  },

  max: (value: any, max: number): string | null => {
    if (value && Number(value) > max) {
      return `Must be no more than ${max}`
    }
    return null
  }
}

// Validate a single field against a rule
function validateField(field: string, value: any, rule: ValidationRule, allValues?: Record<string, any>): string | null {
  // Required check
  if (rule.required) {
    const requiredError = validators.required(value)
    if (requiredError) {
      return rule.message || requiredError
    }
  }

  // Skip other validations if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Min length check
  if (rule.minLength !== undefined) {
    const minLengthError = validators.minLength(value, rule.minLength)
    if (minLengthError) {
      return rule.message || minLengthError
    }
  }

  // Max length check
  if (rule.maxLength !== undefined) {
    const maxLengthError = validators.maxLength(value, rule.maxLength)
    if (maxLengthError) {
      return rule.message || maxLengthError
    }
  }

  // Pattern check
  if (rule.pattern) {
    const patternError = validators.pattern(value, rule.pattern)
    if (patternError) {
      return rule.message || patternError
    }
  }

  // Email check
  if (rule.email) {
    const emailError = validators.email(value)
    if (emailError) {
      return rule.message || emailError
    }
  }

  // URL check
  if (rule.url) {
    const urlError = validators.url(value)
    if (urlError) {
      return rule.message || urlError
    }
  }

  // Numeric check
  if (rule.numeric) {
    const numericError = validators.numeric(value)
    if (numericError) {
      return rule.message || numericError
    }
  }

  // Integer check
  if (rule.integer) {
    const integerError = validators.integer(value)
    if (integerError) {
      return rule.message || integerError
    }
  }

  // Positive check
  if (rule.positive) {
    const positiveError = validators.positive(value)
    if (positiveError) {
      return rule.message || positiveError
    }
  }

  // Min value check
  if (rule.min !== undefined) {
    const minError = validators.min(value, rule.min)
    if (minError) {
      return rule.message || minError
    }
  }

  // Max value check
  if (rule.max !== undefined) {
    const maxError = validators.max(value, rule.max)
    if (maxError) {
      return rule.message || maxError
    }
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value, allValues)
    if (customError) {
      return rule.message || customError
    }
  }

  return null
}

export function useValidation<T extends Record<string, any>>(
  initialSchema?: ValidationSchema
): UseValidationReturn<T> {
  const [state, setState] = useState<ValidationState>({
    errors: [],
    isValid: true,
    isDirty: false,
    touched: new Set(),
    submitted: false
  })

  const schemaRef = useRef<ValidationSchema | undefined>(initialSchema)
  const lastValuesRef = useRef<T | null>(null)

  // Update schema
  const updateSchema = useCallback((newSchema: ValidationSchema) => {
    schemaRef.current = newSchema
  }, [])

  // Validate a single field
  const validateField = useCallback((field: string, value: any, schema?: ValidationSchema): string | null => {
    const validationSchema = schema || schemaRef.current
    if (!validationSchema || !validationSchema[field]) {
      return null
    }

    const rules = Array.isArray(validationSchema[field]) 
      ? validationSchema[field] as ValidationRule[]
      : [validationSchema[field] as ValidationRule]

    for (const rule of rules) {
      const error = validateField(field, value, rule, lastValuesRef.current || undefined)
      if (error) {
        return error
      }
    }

    return null
  }, [])

  // Validate all fields
  const validate = useCallback((values: T, schema?: ValidationSchema): ValidationError[] => {
    const validationSchema = schema || schemaRef.current
    if (!validationSchema) {
      return []
    }

    lastValuesRef.current = values
    const errors: ValidationError[] = []

    for (const [field, rules] of Object.entries(validationSchema)) {
      const value = values[field]
      const fieldRules = Array.isArray(rules) ? rules : [rules]
      
      for (const rule of fieldRules) {
        const error = validateField(field, value, rule, values)
        if (error) {
          errors.push({
            field,
            message: error,
            value
          })
          break // Only add first error per field
        }
      }
    }

    return errors
  }, [validateField])

  // Set field error manually
  const setFieldError = useCallback((field: string, message: string) => {
    setState(prev => {
      const existingErrorIndex = prev.errors.findIndex(error => error.field === field)
      const newError: ValidationError = { field, message, value: undefined }
      
      if (existingErrorIndex >= 0) {
        const newErrors = [...prev.errors]
        newErrors[existingErrorIndex] = newError
        return {
          ...prev,
          errors: newErrors,
          isValid: newErrors.length === 0
        }
      } else {
        return {
          ...prev,
          errors: [...prev.errors, newError],
          isValid: false
        }
      }
    })
  }, [])

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setState(prev => {
      const newErrors = prev.errors.filter(error => error.field !== field)
      return {
        ...prev,
        errors: newErrors,
        isValid: newErrors.length === 0
      }
    })
  }, [])

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      isValid: true
    }))
  }, [])

  // Mark field as touched
  const markFieldAsTouched = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      touched: new Set([...prev.touched, field]),
      isDirty: true
    }))
  }, [])

  // Mark all fields as touched
  const markAllFieldsAsTouched = useCallback(() => {
    setState(prev => ({
      ...prev,
      touched: new Set(Object.keys(schemaRef.current || {})),
      isDirty: true
    }))
  }, [])

  // Reset validation state
  const resetValidation = useCallback(() => {
    setState({
      errors: [],
      isValid: true,
      isDirty: false,
      touched: new Set(),
      submitted: false
    })
    lastValuesRef.current = null
  }, [])

  // Get field error
  const getFieldError = useCallback((field: string): string | null => {
    const error = state.errors.find(error => error.field === field)
    return error ? error.message : null
  }, [state.errors])

  // Check if field has error
  const hasFieldError = useCallback((field: string): boolean => {
    return state.errors.some(error => error.field === field)
  }, [state.errors])

  // Get error count
  const getErrorCount = useCallback((): number => {
    return state.errors.length
  }, [state.errors])

  // Get first error
  const getFirstError = useCallback((): ValidationError | null => {
    return state.errors.length > 0 ? state.errors[0] : null
  }, [state.errors])

  // Computed values
  const isValid = useMemo(() => state.errors.length === 0, [state.errors.length])
  const isDirty = useMemo(() => state.isDirty, [state.isDirty])

  return {
    // State
    errors: state.errors,
    isValid,
    isDirty,
    touched: state.touched,
    submitted: state.submitted,
    
    // Actions
    validate,
    validateField,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    markFieldAsTouched,
    markAllFieldsAsTouched,
    resetValidation,
    
    // Utilities
    getFieldError,
    hasFieldError,
    getErrorCount,
    getFirstError
  }
}

// Predefined validation schemas
export const commonSchemas = {
  email: {
    email: { required: true, email: true, message: 'Please enter a valid email address' }
  },
  
  password: {
    password: {
      required: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  
  username: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: 'Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens'
    }
  },
  
  url: {
    url: {
      required: true,
      url: true,
      message: 'Please enter a valid URL'
    }
  },
  
  phone: {
    phone: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number'
    }
  }
}

// Hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  schema: ValidationSchema,
  initialValues?: T
) {
  const validation = useValidation<T>(schema)
  const [values, setValues] = useState<T>(initialValues || {} as T)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setFieldValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    validation.clearFieldError(field)
  }, [validation])

  const setAllValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }))
  }, [])

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    validation.markAllFieldsAsTouched()
    
    const errors = validation.validate(values)
    if (errors.length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [validation, values])

  const resetForm = useCallback(() => {
    setValues(initialValues || {} as T)
    validation.resetValidation()
  }, [initialValues, validation])

  return {
    ...validation,
    values,
    setFieldValue,
    setAllValues,
    handleSubmit,
    resetForm,
    isSubmitting
  }
}
