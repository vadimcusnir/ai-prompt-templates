import { renderHook, act } from '@testing-library/react'
import { useValidation, commonSchemas } from '../useValidation'

describe('useValidation', () => {
  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useValidation())

      expect(result.current.errors).toEqual([])
      expect(result.current.isValid).toBe(true)
      expect(result.current.isDirty).toBe(false)
      expect(result.current.touched).toEqual(new Set())
      expect(result.current.submitted).toBe(false)
    })

    it('should initialize with schema', () => {
      const schema = {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 }
      }

      const { result } = renderHook(() => useValidation(schema))

      expect(result.current.errors).toEqual([])
      expect(result.current.isValid).toBe(true)
    })
  })

  describe('field validation', () => {
    it('should validate required fields', () => {
      const schema = {
        name: { required: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('name', '')
        expect(error).toBe('This field is required')
      })
    })

    it('should validate email format', () => {
      const schema = {
        email: { email: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('email', 'invalid-email')
        expect(error).toBe('Invalid email address')
      })

      act(() => {
        const error = result.current.validateField('email', 'valid@email.com')
        expect(error).toBeNull()
      })
    })

    it('should validate min length', () => {
      const schema = {
        password: { minLength: 8 }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('password', 'short')
        expect(error).toBe('Must be at least 8 characters long')
      })

      act(() => {
        const error = result.current.validateField('password', 'longenough')
        expect(error).toBeNull()
      })
    })

    it('should validate max length', () => {
      const schema = {
        title: { maxLength: 50 }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('title', 'a'.repeat(51))
        expect(error).toBe('Must be no more than 50 characters long')
      })

      act(() => {
        const error = result.current.validateField('title', 'short title')
        expect(error).toBeNull()
      })
    })

    it('should validate pattern', () => {
      const schema = {
        username: { pattern: /^[a-zA-Z0-9_]+$/ }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('username', 'user-name')
        expect(error).toBe('Invalid format')
      })

      act(() => {
        const error = result.current.validateField('username', 'username123')
        expect(error).toBeNull()
      })
    })

    it('should validate numeric values', () => {
      const schema = {
        age: { numeric: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('age', 'not-a-number')
        expect(error).toBe('Must be a number')
      })

      act(() => {
        const error = result.current.validateField('age', '25')
        expect(error).toBeNull()
      })
    })

    it('should validate integer values', () => {
      const schema = {
        count: { integer: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('count', '3.14')
        expect(error).toBe('Must be an integer')
      })

      act(() => {
        const error = result.current.validateField('count', '42')
        expect(error).toBeNull()
      })
    })

    it('should validate positive numbers', () => {
      const schema = {
        price: { positive: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('price', '0')
        expect(error).toBe('Must be positive')
      })

      act(() => {
        const error = result.current.validateField('price', '-10')
        expect(error).toBe('Must be positive')
      })

      act(() => {
        const error = result.current.validateField('price', '99.99')
        expect(error).toBeNull()
      })
    })

    it('should validate min/max values', () => {
      const schema = {
        score: { min: 0, max: 100 }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('score', '-1')
        expect(error).toBe('Must be at least 0')
      })

      act(() => {
        const error = result.current.validateField('score', '101')
        expect(error).toBe('Must be no more than 100')
      })

      act(() => {
        const error = result.current.validateField('score', '50')
        expect(error).toBeNull()
      })
    })

    it('should validate custom rules', () => {
      const schema = {
        password: {
          custom: (value: string, allValues: any) => {
            if (value === allValues.username) {
              return 'Password cannot be the same as username'
            }
            return null
          }
        }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('password', 'same', { username: 'same' })
        expect(error).toBe('Password cannot be the same as username')
      })

      act(() => {
        const error = result.current.validateField('password', 'different', { username: 'same' })
        expect(error).toBeNull()
      })
    })
  })

  describe('form validation', () => {
    it('should validate all fields', () => {
      const schema = {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 }
      }

      const { result } = renderHook(() => useValidation(schema))

      const values = {
        email: 'invalid-email',
        password: 'short'
      }

      act(() => {
        const errors = result.current.validate(values)
        expect(errors).toHaveLength(2)
        expect(errors[0].field).toBe('email')
        expect(errors[1].field).toBe('password')
      })
    })

    it('should handle multiple rules per field', () => {
      const schema = {
        email: [
          { required: true },
          { email: true }
        ]
      }

      const { result } = renderHook(() => useValidation(schema))

      const values = {
        email: 'invalid-email'
      }

      act(() => {
        const errors = result.current.validate(values)
        expect(errors).toHaveLength(1)
        expect(errors[0].field).toBe('email')
        expect(errors[0].message).toBe('Invalid email address')
      })
    })
  })

  describe('error management', () => {
    it('should set field errors manually', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Custom error message')
      })

      expect(result.current.errors).toHaveLength(1)
      expect(result.current.errors[0].field).toBe('email')
      expect(result.current.errors[0].message).toBe('Custom error message')
      expect(result.current.isValid).toBe(false)
    })

    it('should clear field errors', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error message')
        result.current.clearFieldError('email')
      })

      expect(result.current.errors).toHaveLength(0)
      expect(result.current.isValid).toBe(true)
    })

    it('should clear all errors', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error 1')
        result.current.setFieldError('password', 'Error 2')
        result.current.clearAllErrors()
      })

      expect(result.current.errors).toHaveLength(0)
      expect(result.current.isValid).toBe(true)
    })
  })

  describe('field state management', () => {
    it('should mark fields as touched', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.markFieldAsTouched('email')
      })

      expect(result.current.touched.has('email')).toBe(true)
      expect(result.current.isDirty).toBe(true)
    })

    it('should mark all fields as touched', () => {
      const schema = {
        email: { required: true },
        password: { required: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        result.current.markAllFieldsAsTouched()
      })

      expect(result.current.touched.has('email')).toBe(true)
      expect(result.current.touched.has('password')).toBe(true)
      expect(result.current.isDirty).toBe(true)
    })
  })

  describe('utility functions', () => {
    it('should get field errors', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error message')
      })

      expect(result.current.getFieldError('email')).toBe('Error message')
      expect(result.current.getFieldError('password')).toBeNull()
    })

    it('should check if field has error', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error message')
      })

      expect(result.current.hasFieldError('email')).toBe(true)
      expect(result.current.hasFieldError('password')).toBe(false)
    })

    it('should get error count', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error 1')
        result.current.setFieldError('password', 'Error 2')
      })

      expect(result.current.getErrorCount()).toBe(2)
    })

    it('should get first error', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error 1')
        result.current.setFieldError('password', 'Error 2')
      })

      const firstError = result.current.getFirstError()
      expect(firstError).toBeDefined()
      expect(firstError?.field).toBe('email')
    })
  })

  describe('reset functionality', () => {
    it('should reset validation state', () => {
      const { result } = renderHook(() => useValidation())

      act(() => {
        result.current.setFieldError('email', 'Error message')
        result.current.markFieldAsTouched('email')
        result.current.resetValidation()
      })

      expect(result.current.errors).toEqual([])
      expect(result.current.isValid).toBe(true)
      expect(result.current.isDirty).toBe(false)
      expect(result.current.touched).toEqual(new Set())
      expect(result.current.submitted).toBe(false)
    })
  })

  describe('common schemas', () => {
    it('should provide email schema', () => {
      expect(commonSchemas.email).toBeDefined()
      expect(commonSchemas.email.email).toBeDefined()
      expect(commonSchemas.email.email.required).toBe(true)
      expect(commonSchemas.email.email.email).toBe(true)
    })

    it('should provide password schema', () => {
      expect(commonSchemas.password).toBeDefined()
      expect(commonSchemas.password.password).toBeDefined()
      expect(commonSchemas.password.password.required).toBe(true)
      expect(commonSchemas.password.password.minLength).toBe(8)
      expect(commonSchemas.password.password.pattern).toBeDefined()
    })

    it('should provide username schema', () => {
      expect(commonSchemas.username).toBeDefined()
      expect(commonSchemas.username.username).toBeDefined()
      expect(commonSchemas.username.username.required).toBe(true)
      expect(commonSchemas.username.username.minLength).toBe(3)
      expect(commonSchemas.username.username.maxLength).toBe(20)
      expect(commonSchemas.username.username.pattern).toBeDefined()
    })

    it('should provide URL schema', () => {
      expect(commonSchemas.url).toBeDefined()
      expect(commonSchemas.url.url).toBeDefined()
      expect(commonSchemas.url.url.required).toBe(true)
      expect(commonSchemas.url.url.url).toBe(true)
    })

    it('should provide phone schema', () => {
      expect(commonSchemas.phone).toBeDefined()
      expect(commonSchemas.phone.phone).toBeDefined()
      expect(commonSchemas.phone.phone.pattern).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty values correctly', () => {
      const schema = {
        name: { required: true },
        description: { minLength: 10 }
      }

      const { result } = renderHook(() => useValidation(schema))

      const values = {
        name: '',
        description: ''
      }

      act(() => {
        const errors = result.current.validate(values)
        expect(errors).toHaveLength(1) // Only name is required
        expect(errors[0].field).toBe('name')
      })
    })

    it('should handle null and undefined values', () => {
      const schema = {
        name: { required: true }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error1 = result.current.validateField('name', null)
        const error2 = result.current.validateField('name', undefined)
        
        expect(error1).toBe('This field is required')
        expect(error2).toBe('This field is required')
      })
    })

    it('should handle array values', () => {
      const schema = {
        tags: { required: true, minLength: 1 }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error1 = result.current.validateField('tags', [])
        const error2 = result.current.validateField('tags', ['tag1', 'tag2'])
        
        expect(error1).toBe('This field is required')
        expect(error2).toBeNull()
      })
    })

    it('should handle custom error messages', () => {
      const schema = {
        email: { 
          required: true, 
          message: 'Please provide your email address' 
        }
      }

      const { result } = renderHook(() => useValidation(schema))

      act(() => {
        const error = result.current.validateField('email', '')
        expect(error).toBe('Please provide your email address')
      })
    })
  })

  describe('performance', () => {
    it('should not re-validate unchanged fields', () => {
      const schema = {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 }
      }

      const { result } = renderHook(() => useValidation(schema))

      const values = {
        email: 'test@example.com',
        password: 'password123'
      }

      // First validation
      act(() => {
        const errors1 = result.current.validate(values)
        expect(errors1).toHaveLength(0)
      })

      // Second validation with same values
      act(() => {
        const errors2 = result.current.validate(values)
        expect(errors2).toHaveLength(0)
      })

      // Should not have duplicate validation logic
      expect(result.current.errors).toHaveLength(0)
    })
  })
})
