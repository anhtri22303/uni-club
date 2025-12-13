import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { login, loginWithGoogleToken } from '@/service/authApi'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
jest.mock('@/service/authApi')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('AuthContext', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockPrefetch = jest.fn()
  const mockRouter = {
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }

  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue(null)
    mockLocalStorage.getItem.mockReturnValue(null)
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )

  describe('Initialization', () => {
    it('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should provide auth context', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current).toHaveProperty('login')
      expect(result.current).toHaveProperty('logout')
      expect(result.current).toHaveProperty('googleLogin')
      expect(result.current).toHaveProperty('isAuthenticated')
    })
  })

  describe('Login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        success: true,
        data: {
          userId: 1,
          email: 'test@example.com',
          role: 'ADMIN',
          token: 'fake-jwt-token',
        },
      }
      ;(login as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), { wrapper })

      let loginSuccess: boolean = false
      await act(async () => {
        loginSuccess = await result.current.login('test@example.com', 'password')
      })

      expect(loginSuccess).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle login failure', async () => {
      ;(login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      let loginSuccess: boolean = true
      await act(async () => {
        loginSuccess = await result.current.login('test@example.com', 'wrong-password')
      })

      expect(loginSuccess).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Google Login', () => {
    it('should login successfully with Google token', async () => {
      const mockUser = {
        success: true,
        data: {
          userId: 2,
          email: 'google@example.com',
          role: 'STUDENT',
          token: 'google-jwt-token',
        },
      }
      ;(loginWithGoogleToken as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), { wrapper })

      let loginSuccess: boolean = false
      await act(async () => {
        loginSuccess = await result.current.googleLogin('google-token-123')
      })

      expect(loginSuccess).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle Google login failure', async () => {
      ;(loginWithGoogleToken as jest.Mock).mockRejectedValue(new Error('Invalid Google token'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      let loginSuccess: boolean = true
      await act(async () => {
        loginSuccess = await result.current.googleLogin('invalid-token')
      })

      expect(loginSuccess).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Logout', () => {
    it('should logout and clear session data', async () => {
      // First login
      const mockUser = {
        success: true,
        data: {
          userId: 1,
          email: 'test@example.com',
          role: 'STUDENT',
          token: 'fake-jwt-token',
        },
      }
      ;(login as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.login('test@example.com', 'password')
      })

      // Then logout
      await act(async () => {
        result.current.logout()
      })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })
    })
  })

  describe('Role Normalization', () => {
    it('should handle different role formats', async () => {
      const mockUser = {
        success: true,
        data: {
          userId: 1,
          email: 'test@example.com',
          role: 'ADMIN',
          token: 'fake-jwt-token',
        },
      }
      ;(login as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.login('test@example.com', 'password')
      })

      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
