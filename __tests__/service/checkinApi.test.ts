import axiosInstance from '@/lib/axiosInstance'
import { generateCode, checkin } from '@/service/checkinApi'

jest.mock('@/lib/axiosInstance')

describe('CheckinApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateCode', () => {
    it('should generate check-in code successfully', async () => {
      const mockResponse = {
        data: {
          token: 'abc123xyz',
          qrUrl: 'https://example.com/qr/abc123xyz',
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await generateCode(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/attendance/qr-token/1')
      expect(result.token).toBe('abc123xyz')
      expect(result.qrUrl).toContain('abc123xyz')
    })

    it('should handle event not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      })

      await expect(generateCode(999)).rejects.toBeTruthy()
    })

    it('should handle invalid response format', async () => {
      const mockResponse = {
        data: {},
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      await expect(generateCode(1)).rejects.toThrow('Failed to generate code - invalid response')
    })

    it('should handle missing token in response', async () => {
      const mockResponse = {
        data: {
          qrUrl: 'https://example.com/qr/missing',
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      await expect(generateCode(1)).rejects.toThrow()
    })
  })

  describe('checkin', () => {
    it('should check in successfully with string response', async () => {
      const mockResponse = {
        data: 'Checked-in',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await checkin('abc123xyz')

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/attendance/checkin',
        null,
        { params: { token: 'abc123xyz' } }
      )
      expect(result).toBe('Checked-in')
    })

    it('should check in successfully with object response', async () => {
      const mockResponse = {
        data: {
          message: 'Check-in successful',
          data: {
            attendanceId: 1,
            points: 10,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await checkin('abc123xyz')

      expect(result).toBe('Check-in successful')
    })

    it('should handle invalid token', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid or expired token' },
        },
      })

      await expect(checkin('invalid_token')).rejects.toThrow('Invalid or expired token')
    })

    it('should handle already checked in', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Already checked in' },
        },
      })

      await expect(checkin('abc123xyz')).rejects.toThrow('Already checked in')
    })

    it('should handle event not started', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Event has not started yet' },
        },
      })

      await expect(checkin('abc123xyz')).rejects.toThrow('Event has not started yet')
    })

    it('should handle event ended', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: 'Event has already ended',
        },
      })

      await expect(checkin('abc123xyz')).rejects.toThrow()
    })

    it('should handle network error', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(checkin('abc123xyz')).rejects.toThrow()
    })

    it('should handle empty token', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Token is required' },
        },
      })

      await expect(checkin('')).rejects.toThrow('Token is required')
    })
  })
})
