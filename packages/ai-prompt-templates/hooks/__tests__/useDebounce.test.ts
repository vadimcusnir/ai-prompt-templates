import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce, useDebounceCallback, useDebounceState } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('useDebounce', () => {
    it('should debounce value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      )

      expect(result.current).toBe('initial')

      // Change value multiple times quickly
      rerender({ value: 'changed1', delay: 100 })
      rerender({ value: 'changed2', delay: 100 })
      rerender({ value: 'final', delay: 100 })

      // Value should still be initial
      expect(result.current).toBe('initial')

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Value should now be updated
      expect(result.current).toBe('final')
    })

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      )

      rerender({ value: 'changed', delay: 500 })

      // Value should not change immediately
      expect(result.current).toBe('initial')

      // Fast forward less than delay
      act(() => {
        jest.advanceTimersByTime(400)
      })

      // Value should still not change
      expect(result.current).toBe('initial')

      // Fast forward to complete delay
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Value should now change
      expect(result.current).toBe('changed')
    })

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 0 } }
      )

      rerender({ value: 'changed', delay: 0 })

      // With zero delay, value should change immediately
      expect(result.current).toBe('changed')
    })

    it('should handle negative delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: -100 } }
      )

      rerender({ value: 'changed', delay: -100 })

      // With negative delay, value should change immediately
      expect(result.current).toBe('changed')
    })

    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      
      const { unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      )

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('useDebounceCallback', () => {
    it('should debounce function calls', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(
        ({ delay }) => useDebounceCallback(mockCallback, delay),
        { initialProps: { delay: 100 } }
      )

      // Call function multiple times quickly
      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      // Function should not be called yet
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Function should be called once with last argument
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg3')
    })

    it('should handle different delay values', () => {
      const mockCallback = jest.fn()
      const { result, rerender } = renderHook(
        ({ delay }) => useDebounceCallback(mockCallback, delay),
        { initialProps: { delay: 200 } }
      )

      act(() => {
        result.current('test')
      })

      // Function should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast forward less than delay
      act(() => {
        jest.advanceTimersByTime(150)
      })

      // Function should still not be called
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast forward to complete delay
      act(() => {
        jest.advanceTimersByTime(50)
      })

      // Function should now be called
      expect(mockCallback).toHaveBeenCalledWith('test')
    })

    it('should handle zero delay', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(
        ({ delay }) => useDebounceCallback(mockCallback, delay),
        { initialProps: { delay: 0 } }
      )

      act(() => {
        result.current('test')
      })

      // With zero delay, function should be called immediately
      expect(mockCallback).toHaveBeenCalledWith('test')
    })

    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const mockCallback = jest.fn()
      
      const { unmount } = renderHook(
        ({ delay }) => useDebounceCallback(mockCallback, delay),
        { initialProps: { delay: 100 } }
      )

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should handle multiple rapid calls correctly', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(
        ({ delay }) => useDebounceCallback(mockCallback, delay),
        { initialProps: { delay: 100 } }
      )

      // Call function rapidly
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current(`call-${i}`)
        }
      })

      // Function should not be called yet
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Function should be called once with last argument
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('call-9')
    })
  })

  describe('useDebounceState', () => {
    it('should provide immediate and debounced values', () => {
      const { result, rerender } = renderHook(
        ({ initialValue, delay }) => useDebounceState(initialValue, delay),
        { initialProps: { initialValue: 'initial', delay: 100 } }
      )

      const [immediateValue, debouncedValue, setValue] = result.current

      expect(immediateValue).toBe('initial')
      expect(debouncedValue).toBe('initial')

      // Change value
      act(() => {
        setValue('changed')
      })

      // Immediate value should change
      expect(result.current[0]).toBe('changed')
      // Debounced value should still be old value
      expect(result.current[1]).toBe('initial')

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Debounced value should now be updated
      expect(result.current[1]).toBe('changed')
    })

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ initialValue, delay }) => useDebounceState(initialValue, delay),
        { initialProps: { initialValue: 0, delay: 300 } }
      )

      const [immediateValue, debouncedValue, setValue] = result.current

      // Change value
      act(() => {
        setValue(100)
      })

      // Immediate value should change
      expect(result.current[0]).toBe(100)
      // Debounced value should still be old value
      expect(result.current[1]).toBe(0)

      // Fast forward less than delay
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Debounced value should still be old value
      expect(result.current[1]).toBe(0)

      // Fast forward to complete delay
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Debounced value should now be updated
      expect(result.current[1]).toBe(100)
    })

    it('should handle zero delay', () => {
      const { result } = renderHook(
        ({ initialValue, delay }) => useDebounceState(initialValue, delay),
        { initialProps: { initialValue: 'initial', delay: 0 } }
      )

      const [immediateValue, debouncedValue, setValue] = result.current

      act(() => {
        setValue('changed')
      })

      // With zero delay, both values should change immediately
      expect(result.current[0]).toBe('changed')
      expect(result.current[1]).toBe('changed')
    })

    it('should handle multiple rapid changes', () => {
      const { result } = renderHook(
        ({ initialValue, delay }) => useDebounceState(initialValue, delay),
        { initialProps: { initialValue: 0, delay: 100 } }
      )

      const [immediateValue, debouncedValue, setValue] = result.current

      // Change value rapidly
      act(() => {
        setValue(1)
        setValue(2)
        setValue(3)
        setValue(4)
        setValue(5)
      })

      // Immediate value should be last value
      expect(result.current[0]).toBe(5)
      // Debounced value should still be initial
      expect(result.current[1]).toBe(0)

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Debounced value should be last value
      expect(result.current[1]).toBe(5)
    })

    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      
      const { unmount } = renderHook(
        ({ initialValue, delay }) => useDebounceState(initialValue, delay),
        { initialProps: { initialValue: 'initial', delay: 100 } }
      )

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined values', () => {
      const { result } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: undefined, delay: 100 } }
      )

      expect(result.current).toBeUndefined()
    })

    it('should handle null values', () => {
      const { result } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: null, delay: 100 } }
      )

      expect(result.current).toBeNull()
    })

    it('should handle object values', () => {
      const initialObj = { name: 'initial' }
      const changedObj = { name: 'changed' }

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: initialObj, delay: 100 } }
      )

      expect(result.current).toBe(initialObj)

      rerender({ value: changedObj, delay: 100 })

      // Value should still be initial object
      expect(result.current).toBe(initialObj)

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Value should now be changed object
      expect(result.current).toBe(changedObj)
    })

    it('should handle array values', () => {
      const initialArray = [1, 2, 3]
      const changedArray = [4, 5, 6]

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: initialArray, delay: 100 } }
      )

      expect(result.current).toBe(initialArray)

      rerender({ value: changedArray, delay: 100 })

      // Value should still be initial array
      expect(result.current).toBe(initialArray)

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Value should now be changed array
      expect(result.current).toBe(changedArray)
    })
  })
})
