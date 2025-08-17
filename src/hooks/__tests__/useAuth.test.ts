import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth, AuthProvider } from '../useAuth'
import { createClientSideClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/logger')

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(),
}

const mockCreateClientSideClient = createClientSideClient as jest.MockedFunction<typeof createClientSideClient>

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClientSideClient.mockReturnValue(mockSupabase as any)
  })

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  } as User

  const mockSubscription = {
    tier: 'architect' as const,
    status: 'active',
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  describe('initialization', () => {
    it('should initialize with default values', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.userTier).toBe('free')
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should load existing session on mount', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.userTier).toBe('architect')
      })
    })

    it('should handle session error gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBeNull()
        expect(result.current.userTier).toBe('free')
      })
    })
  })

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const signInResult = await result.current.signIn('test@example.com', 'password')
        expect(signInResult.error).toBeUndefined()
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
    })

    it('should handle sign in error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const signInResult = await result.current.signIn('test@example.com', 'wrong-password')
        expect(signInResult.error).toBe('Invalid credentials')
      })
    })
  })

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const signUpResult = await result.current.signUp('new@example.com', 'password')
        expect(signUpResult.error).toBeUndefined()
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
      })
    })

    it('should handle sign up error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const signUpResult = await result.current.signUp('existing@example.com', 'password')
        expect(signUpResult.error).toBe('Email already exists')
      })
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('refreshUserTier', () => {
    it('should refresh user tier successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.userTier).toBe('architect')
      })

      // Mock updated subscription
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockSubscription, tier: 'elite' },
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      await act(async () => {
        await result.current.refreshUserTier()
      })

      expect(result.current.userTier).toBe('elite')
    })

    it('should handle tier refresh error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.userTier).toBe('free') // Should fallback to free
      })
    })
  })

  describe('auth state changes', () => {
    it('should handle SIGNED_IN event', async () => {
      let authChangeCallback: ((event: string, session: any) => void) | null = null

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate auth state change
      if (authChangeCallback) {
        await act(async () => {
          authChangeCallback('SIGNED_IN', { user: mockUser })
        })
      }

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.userTier).toBe('architect')
    })

    it('should handle SIGNED_OUT event', async () => {
      let authChangeCallback: ((event: string, session: any) => void) | null = null

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
      })

      // Simulate auth state change
      if (authChangeCallback) {
        await act(async () => {
          authChangeCallback('SIGNED_OUT', null)
        })
      }

      expect(result.current.user).toBeNull()
      expect(result.current.userTier).toBe('free')
    })
  })

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBeNull()
        expect(result.current.userTier).toBe('free')
      })
    })

    it('should handle sign in network errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const signInResult = await result.current.signIn('test@example.com', 'password')
        expect(signInResult.error).toBe('An unexpected error occurred')
      })
    })
  })
})
