import axiosInstance from '@/lib/axiosInstance'
import {
  login,
  loginWithGoogleToken,
  signUp,
  forgotPassword,
  resetPassword,
  changePassword,
} from '@/service/authApi'

jest.mock('@/lib/axiosInstance')

describe('AuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'STUDENT',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual(mockResponse)
      expect(result.token).toBe('fake-jwt-token')
    })

    it('should handle login failure', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      })

      await expect(
        login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toBeTruthy()
    })

    it('should handle network errors', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await expect(
        login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network error')
    })
  })

  describe('loginWithGoogleToken', () => {
    it('should login with Google token successfully', async () => {
      const mockResponse = {
        token: 'google-jwt-token',
        userId: 2,
        email: 'google@example.com',
        fullName: 'Google User',
        role: 'STUDENT',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await loginWithGoogleToken({ token: 'google-token-123' })

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid Google token', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid Google token' },
        },
      })

      await expect(
        loginWithGoogleToken({ token: 'invalid-token' })
      ).rejects.toBeTruthy()
    })
  })

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User registered successfully',
        token: 'new-user-token',
        userId: 3,
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await signUp({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        studentCode: 'ST001',
      })

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle duplicate email', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Email already exists' },
        },
      })

      await expect(
        signUp({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'User',
          studentCode: 'ST001',
        })
      ).rejects.toBeTruthy()
    })

    it('should handle validation errors', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid email format' },
        },
      })

      await expect(
        signUp({
          email: 'invalid-email',
          password: '123',
          fullName: '',
          studentCode: '',
        })
      ).rejects.toBeTruthy()
    })
  })

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const mockResponse = {
        success: true,
        message: 'Reset email sent successfully',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await forgotPassword('user@example.com')

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle non-existent email', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Email not found' },
        },
      })

      await expect(forgotPassword('nonexistent@example.com')).rejects.toBeTruthy()
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset successfully',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await resetPassword('reset-token-123', 'newpassword123')

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle invalid reset token', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid or expired token' },
        },
      })

      await expect(
        resetPassword('invalid-token', 'newpassword')
      ).rejects.toBeTruthy()
    })

    it('should handle weak password', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Password too weak' },
        },
      })

      await expect(resetPassword('token', '123')).rejects.toBeTruthy()
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password changed successfully',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await changePassword('oldpassword', 'newpassword123')

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should handle incorrect old password', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Incorrect old password' },
        },
      })

      await expect(
        changePassword('wrongpassword', 'newpassword123')
      ).rejects.toBeTruthy()
    })

    it('should handle same password error', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'New password must be different' },
        },
      })

      await expect(
        changePassword('password123', 'password123')
      ).rejects.toBeTruthy()
    })
  })
})
