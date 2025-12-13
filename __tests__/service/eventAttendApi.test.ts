import axiosInstance from '@/lib/axiosInstance'
import {
  getEventAttendStats,
  getEventAttendFraud,
} from '@/service/eventAttendApi'

jest.mock('@/lib/axiosInstance')

describe('EventAttendApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEventAttendStats', () => {
    it('should fetch attendance statistics', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Stats fetched',
          data: {
            eventId: 10,
            eventName: 'Workshop',
            totalRegistered: 100,
            checkinCount: 90,
            midCount: 85,
            checkoutCount: 80,
            noneCount: 10,
            halfCount: 5,
            fullCount: 80,
            suspiciousCount: 5,
            participationRate: 0.9,
            midComplianceRate: 0.94,
            fraudRate: 0.05,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendStats(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/attendance/stats/10')
      expect(result.data.totalRegistered).toBe(100)
      expect(result.data.participationRate).toBe(0.9)
    })

    it('should calculate fraud rate correctly', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Stats fetched',
          data: {
            eventId: 10,
            eventName: 'Workshop',
            totalRegistered: 50,
            checkinCount: 45,
            midCount: 40,
            checkoutCount: 38,
            noneCount: 5,
            halfCount: 2,
            fullCount: 38,
            suspiciousCount: 10,
            participationRate: 0.9,
            midComplianceRate: 0.89,
            fraudRate: 0.2,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendStats(10)

      expect(result.data.suspiciousCount).toBe(10)
      expect(result.data.fraudRate).toBe(0.2)
    })

    it('should handle zero attendance', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Stats fetched',
          data: {
            eventId: 10,
            eventName: 'Workshop',
            totalRegistered: 20,
            checkinCount: 0,
            midCount: 0,
            checkoutCount: 0,
            noneCount: 20,
            halfCount: 0,
            fullCount: 0,
            suspiciousCount: 0,
            participationRate: 0,
            midComplianceRate: 0,
            fraudRate: 0,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendStats(10)

      expect(result.data.checkinCount).toBe(0)
      expect(result.data.participationRate).toBe(0)
    })

    it('should handle event not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      })

      await expect(getEventAttendStats(999)).rejects.toBeTruthy()
    })

    it('should handle perfect attendance', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Stats fetched',
          data: {
            eventId: 10,
            eventName: 'Workshop',
            totalRegistered: 50,
            checkinCount: 50,
            midCount: 50,
            checkoutCount: 50,
            noneCount: 0,
            halfCount: 0,
            fullCount: 50,
            suspiciousCount: 0,
            participationRate: 1.0,
            midComplianceRate: 1.0,
            fraudRate: 0,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendStats(10)

      expect(result.data.fullCount).toBe(50)
      expect(result.data.participationRate).toBe(1.0)
      expect(result.data.fraudRate).toBe(0)
    })
  })

  describe('getEventAttendFraud', () => {
    it('should fetch fraud records', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Fraud records fetched',
          data: [
            {
              registrationId: 1,
              memberName: 'John Doe',
              memberEmail: 'john@example.com',
              checkinAt: '2024-01-01T09:00:00Z',
              checkMidAt: null,
              checkoutAt: '2024-01-01T12:00:00Z',
              fraudReason: 'Missing mid-check',
            },
            {
              registrationId: 2,
              memberName: 'Jane Smith',
              memberEmail: 'jane@example.com',
              checkinAt: '2024-01-01T09:05:00Z',
              checkMidAt: '2024-01-01T09:06:00Z',
              checkoutAt: '2024-01-01T09:07:00Z',
              fraudReason: 'Suspiciously fast check sequence',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendFraud(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/attendance/fraud/10')
      expect(result.data).toHaveLength(2)
      expect(result.data[0].fraudReason).toBe('Missing mid-check')
    })

    it('should handle no fraud records', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No fraud detected',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendFraud(10)

      expect(result.data).toEqual([])
    })

    it('should handle multiple fraud types', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Fraud records fetched',
          data: [
            {
              registrationId: 1,
              memberName: 'John Doe',
              memberEmail: 'john@example.com',
              checkinAt: null,
              checkMidAt: null,
              checkoutAt: '2024-01-01T12:00:00Z',
              fraudReason: 'Checkout without checkin',
            },
            {
              registrationId: 2,
              memberName: 'Jane Smith',
              memberEmail: 'jane@example.com',
              checkinAt: '2024-01-01T09:00:00Z',
              checkMidAt: null,
              checkoutAt: null,
              fraudReason: 'Only checked in',
            },
            {
              registrationId: 3,
              memberName: 'Bob Wilson',
              memberEmail: 'bob@example.com',
              checkinAt: '2024-01-01T09:00:00Z',
              checkMidAt: '2024-01-01T09:01:00Z',
              checkoutAt: '2024-01-01T09:02:00Z',
              fraudReason: 'Too fast completion',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventAttendFraud(10)

      expect(result.data).toHaveLength(3)
      expect(result.data.map((f) => f.fraudReason)).toEqual([
        'Checkout without checkin',
        'Only checked in',
        'Too fast completion',
      ])
    })

    it('should handle event not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      })

      await expect(getEventAttendFraud(999)).rejects.toBeTruthy()
    })
  })
})
