import axiosInstance from '@/lib/axiosInstance'
import {
  createPointRequest,
  fetchPendingPointRequests,
  reviewPointRequest,
  fetchAllPointRequests,
  fetchPointRequestById,
} from '@/service/pointRequestsApi'

jest.mock('@/lib/axiosInstance')

describe('PointRequestsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPointRequest', () => {
    it('should create point request successfully', async () => {
      const payload = {
        clubId: 1,
        requestedPoints: 100,
        reason: 'Event hosting reward',
      }
      const mockResponse = {
        success: true,
        message: 'Point request created',
        data: {
          id: 1,
          clubName: 'Tech Club',
          requestedPoints: 100,
          reason: 'Event hosting reward',
          status: 'PENDING' as const,
          staffNote: null,
          createdAt: '2025-01-15T10:00:00Z',
          reviewedAt: null,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await createPointRequest(payload)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/point-requests', payload)
      expect(result.success).toBe(true)
      expect(result.data.requestedPoints).toBe(100)
    })

    it('should handle invalid club id', async () => {
      const payload = {
        clubId: 999,
        requestedPoints: 100,
        reason: 'Test',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(createPointRequest(payload)).rejects.toBeTruthy()
    })

    it('should handle negative points', async () => {
      const payload = {
        clubId: 1,
        requestedPoints: -50,
        reason: 'Invalid',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Requested points must be positive' },
        },
      })

      await expect(createPointRequest(payload)).rejects.toBeTruthy()
    })
  })

  describe('fetchPendingPointRequests', () => {
    it('should fetch pending point requests', async () => {
      const mockResponse = {
        success: true,
        message: 'Pending requests fetched',
        data: [
          {
            id: 1,
            clubName: 'Tech Club',
            requestedPoints: 100,
            reason: 'Event hosting',
            status: 'PENDING' as const,
            staffNote: null,
            createdAt: '2025-01-15T10:00:00Z',
            reviewedAt: null,
          },
          {
            id: 2,
            clubName: 'Art Club',
            requestedPoints: 50,
            reason: 'Workshop',
            status: 'PENDING' as const,
            staffNote: null,
            createdAt: '2025-01-15T11:00:00Z',
            reviewedAt: null,
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchPendingPointRequests()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/point-requests/pending')
      expect(result.data).toHaveLength(2)
      expect(result.data[0].status).toBe('PENDING')
    })

    it('should handle no pending requests', async () => {
      const mockResponse = {
        success: true,
        message: 'No pending requests',
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchPendingPointRequests()

      expect(result.data).toEqual([])
    })
  })

  describe('reviewPointRequest', () => {
    it('should approve point request with note', async () => {
      const payload = {
        approve: true,
        note: 'Good event organization',
      }
      const mockResponse = {
        success: true,
        message: 'Point request approved',
        data: 'Request approved successfully',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await reviewPointRequest(1, payload)

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/point-requests/1/review',
        null,
        {
          params: {
            approve: true,
            note: 'Good event organization',
          },
        }
      )
      expect(result.success).toBe(true)
    })

    it('should reject point request with reason', async () => {
      const payload = {
        approve: false,
        note: 'Insufficient documentation',
      }
      const mockResponse = {
        success: true,
        message: 'Point request rejected',
        data: 'Request rejected',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await reviewPointRequest(2, payload)

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/point-requests/2/review',
        null,
        {
          params: {
            approve: false,
            note: 'Insufficient documentation',
          },
        }
      )
      expect(result.message).toBe('Point request rejected')
    })

    it('should approve without note', async () => {
      const payload = {
        approve: true,
      }
      const mockResponse = {
        success: true,
        message: 'Approved',
        data: 'Success',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await reviewPointRequest(3, payload)

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/point-requests/3/review',
        null,
        {
          params: {
            approve: true,
            note: undefined,
          },
        }
      )
      expect(result.success).toBe(true)
    })

    it('should handle request not found', async () => {
      const payload = {
        approve: true,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Point request not found' },
        },
      })

      await expect(reviewPointRequest(999, payload)).rejects.toBeTruthy()
    })

    it('should handle already reviewed request', async () => {
      const payload = {
        approve: true,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Request already reviewed' },
        },
      })

      await expect(reviewPointRequest(1, payload)).rejects.toBeTruthy()
    })
  })

  describe('fetchAllPointRequests', () => {
    it('should fetch all point requests', async () => {
      const mockResponse = {
        success: true,
        message: 'All requests fetched',
        data: [
          {
            id: 1,
            clubName: 'Tech Club',
            requestedPoints: 100,
            reason: 'Event',
            status: 'APPROVED' as const,
            staffNote: 'Good job',
            createdAt: '2025-01-10T10:00:00Z',
            reviewedAt: '2025-01-11T10:00:00Z',
          },
          {
            id: 2,
            clubName: 'Art Club',
            requestedPoints: 50,
            reason: 'Workshop',
            status: 'PENDING' as const,
            staffNote: null,
            createdAt: '2025-01-15T10:00:00Z',
            reviewedAt: null,
          },
          {
            id: 3,
            clubName: 'Music Club',
            requestedPoints: 75,
            reason: 'Concert',
            status: 'REJECTED' as const,
            staffNote: 'Not enough proof',
            createdAt: '2025-01-12T10:00:00Z',
            reviewedAt: '2025-01-13T10:00:00Z',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchAllPointRequests()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/point-requests/all')
      expect(result.data).toHaveLength(3)
      expect(result.data[0].status).toBe('APPROVED')
      expect(result.data[1].status).toBe('PENDING')
      expect(result.data[2].status).toBe('REJECTED')
    })
  })

  describe('fetchPointRequestById', () => {
    it('should fetch point request by id', async () => {
      const mockResponse = {
        success: true,
        message: 'Request fetched',
        data: {
          id: 1,
          clubName: 'Tech Club',
          requestedPoints: 100,
          reason: 'Event hosting reward',
          status: 'APPROVED' as const,
          staffNote: 'Excellent event',
          createdAt: '2025-01-10T10:00:00Z',
          reviewedAt: '2025-01-11T10:00:00Z',
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchPointRequestById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/point-requests/1')
      expect(result.data.id).toBe(1)
      expect(result.data.status).toBe('APPROVED')
    })

    it('should fetch by string id', async () => {
      const mockResponse = {
        success: true,
        message: 'Request fetched',
        data: {
          id: 5,
          clubName: 'Sports Club',
          requestedPoints: 200,
          reason: 'Tournament',
          status: 'PENDING' as const,
          staffNote: null,
          createdAt: '2025-01-15T10:00:00Z',
          reviewedAt: null,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchPointRequestById('5')

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/point-requests/5')
      expect(result.data.clubName).toBe('Sports Club')
    })

    it('should handle request not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Point request not found' },
        },
      })

      await expect(fetchPointRequestById(999)).rejects.toBeTruthy()
    })
  })
})
