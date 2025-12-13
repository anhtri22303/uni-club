import axiosInstance from '@/lib/axiosInstance'
import signUpApi, { SignUpData } from '@/service/signUpApi'

jest.mock('@/lib/axiosInstance')

describe('SignUpApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should register new user successfully', async () => {
      const signUpData: SignUpData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      }
      const mockResponse = {
        data: {
          message: 'Registration successful',
          user: {
            id: '1',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await signUpApi.register(signUpData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/register', signUpData)
      expect(result.message).toBe('Registration successful')
      expect(result.user?.fullName).toBe('John Doe')
    })

    it('should register without returning user data', async () => {
      const signUpData: SignUpData = {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        password: 'Pass456!',
      }
      const mockResponse = {
        data: {
          message: 'Registration successful. Please verify your email.',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await signUpApi.register(signUpData)

      expect(result.message).toContain('verify')
      expect(result.user).toBeUndefined()
    })

    it('should handle duplicate email', async () => {
      const signUpData: SignUpData = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        password: 'Pass123!',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Email already exists' },
        },
      })

      await expect(signUpApi.register(signUpData)).rejects.toBeTruthy()
    })

    it('should handle weak password', async () => {
      const signUpData: SignUpData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: '123',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Password too weak' },
        },
      })

      await expect(signUpApi.register(signUpData)).rejects.toBeTruthy()
    })

    it('should handle invalid email format', async () => {
      const signUpData: SignUpData = {
        fullName: 'John Doe',
        email: 'invalid-email',
        password: 'Pass123!',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid email format' },
        },
      })

      await expect(signUpApi.register(signUpData)).rejects.toBeTruthy()
    })

    it('should handle missing required fields', async () => {
      const signUpData: SignUpData = {
        fullName: '',
        email: 'john@example.com',
        password: 'Pass123!',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Full name is required' },
        },
      })

      await expect(signUpApi.register(signUpData)).rejects.toBeTruthy()
    })

    it('should handle network error', async () => {
      const signUpData: SignUpData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Pass123!',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(signUpApi.register(signUpData)).rejects.toThrow('Network error')
    })

    it('should handle server error', async () => {
      const signUpData: SignUpData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Pass123!',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      })

      await expect(signUpApi.register(signUpData)).rejects.toBeTruthy()
    })
  })
})
