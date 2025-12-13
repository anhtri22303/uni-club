import axiosInstance from '@/lib/axiosInstance'
import {
  getEventStaff,
  getEventStaffCompleted,
  postEventStaff,
  deleteEventStaff,
  evaluateEventStaff,
  getEvaluateEventStaff,
  getTopEvaluatedStaff,
  getMyStaff,
  getStaffHistory,
} from '@/service/eventStaffApi'

jest.mock('@/lib/axiosInstance')

describe('EventStaffApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEventStaff', () => {
    it('should fetch event staff list', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Staff fetched',
          data: [
            {
              id: 1,
              eventId: 10,
              eventName: 'Workshop',
              membershipId: 5,
              memberName: 'John Doe',
              duty: 'Registration',
              state: 'ACTIVE',
              assignedAt: '2024-01-01T10:00:00Z',
              unassignedAt: null,
            },
            {
              id: 2,
              eventId: 10,
              eventName: 'Workshop',
              membershipId: 6,
              memberName: 'Jane Smith',
              duty: 'Photography',
              state: 'ACTIVE',
              assignedAt: '2024-01-01T10:00:00Z',
              unassignedAt: null,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventStaff(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/10/staffs')
      expect(result).toHaveLength(2)
      expect(result[0].duty).toBe('Registration')
    })

    it('should handle no staff assigned', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No staff',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventStaff(10)

      expect(result).toEqual([])
    })
  })

  describe('getEventStaffCompleted', () => {
    it('should fetch completed event staff', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Completed staff',
          data: [
            {
              id: 1,
              eventId: 10,
              eventName: 'Workshop',
              membershipId: 5,
              memberName: 'John Doe',
              duty: 'Registration',
              state: 'INACTIVE',
              assignedAt: '2024-01-01T10:00:00Z',
              unassignedAt: '2024-01-01T18:00:00Z',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEventStaffCompleted(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/10/staffs/completed')
      expect(result[0].state).toBe('INACTIVE')
      expect(result[0].unassignedAt).not.toBeNull()
    })
  })

  describe('postEventStaff', () => {
    it('should assign staff to event', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Staff assigned',
          data: {
            id: 1,
            eventId: 10,
            eventName: 'Workshop',
            membershipId: 5,
            memberName: 'John Doe',
            duty: 'Security',
            state: 'ACTIVE',
            assignedAt: '2024-01-01T10:00:00Z',
            unassignedAt: null,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await postEventStaff(10, 5, 'Security')

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/events/10/staffs', null, {
        params: {
          membershipId: 5,
          duty: 'Security',
        },
      })
      expect(result.duty).toBe('Security')
      expect(result.state).toBe('ACTIVE')
    })

    it('should handle member already assigned', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Member already assigned' },
        },
      })

      await expect(postEventStaff(10, 5, 'Security')).rejects.toBeTruthy()
    })
  })

  describe('deleteEventStaff', () => {
    it('should remove staff from event', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Staff removed',
          data: 'Removed successfully',
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteEventStaff(10, 1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/events/10/staffs/1')
      expect(result).toBe('Removed successfully')
    })

    it('should handle staff not found', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Staff not found' },
        },
      })

      await expect(deleteEventStaff(10, 999)).rejects.toBeTruthy()
    })
  })

  describe('evaluateEventStaff', () => {
    it('should evaluate staff as EXCELLENT', async () => {
      const evaluationData = {
        membershipId: 5,
        eventId: 10,
        performance: 'EXCELLENT' as const,
        note: 'Outstanding work!',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Staff evaluated',
          data: {
            id: 1,
            eventStaffId: 1,
            membershipId: 5,
            eventId: 10,
            performance: 'EXCELLENT',
            note: 'Outstanding work!',
            createdAt: '2024-01-01T18:00:00Z',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await evaluateEventStaff(10, evaluationData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/events/10/staff/evaluate', evaluationData)
      expect(result.performance).toBe('EXCELLENT')
    })

    it('should evaluate staff as POOR', async () => {
      const evaluationData = {
        membershipId: 5,
        eventId: 10,
        performance: 'POOR' as const,
        note: 'Needs improvement',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Staff evaluated',
          data: {
            id: 2,
            eventStaffId: 1,
            membershipId: 5,
            eventId: 10,
            performance: 'POOR',
            note: 'Needs improvement',
            createdAt: '2024-01-01T18:00:00Z',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await evaluateEventStaff(10, evaluationData)

      expect(result.performance).toBe('POOR')
    })

    it('should handle duplicate evaluation', async () => {
      const evaluationData = {
        membershipId: 5,
        eventId: 10,
        performance: 'GOOD' as const,
        note: 'Duplicate',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Staff already evaluated' },
        },
      })

      await expect(evaluateEventStaff(10, evaluationData)).rejects.toBeTruthy()
    })
  })

  describe('getEvaluateEventStaff', () => {
    it('should fetch all staff evaluations', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Evaluations fetched',
          data: [
            {
              id: 1,
              eventStaffId: 1,
              membershipId: 5,
              eventId: 10,
              performance: 'EXCELLENT',
              note: 'Great job',
              createdAt: '2024-01-01T18:00:00Z',
            },
            {
              id: 2,
              eventStaffId: 2,
              membershipId: 6,
              eventId: 10,
              performance: 'GOOD',
              note: 'Well done',
              createdAt: '2024-01-01T18:05:00Z',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getEvaluateEventStaff(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/10/staff/evaluations')
      expect(result).toHaveLength(2)
    })
  })

  describe('getTopEvaluatedStaff', () => {
    it('should fetch top evaluated staff', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Top staff',
          data: [
            {
              id: 1,
              eventStaffId: 1,
              membershipId: 5,
              eventId: 10,
              performance: 'EXCELLENT',
              note: 'Best performer',
              createdAt: '2024-01-01T18:00:00Z',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getTopEvaluatedStaff(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/10/staff/evaluations/top')
      expect(result[0].performance).toBe('EXCELLENT')
    })
  })

  describe('getMyStaff', () => {
    it('should fetch my staff events', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'My staff events',
          data: [
            {
              eventId: 10,
              eventName: 'Workshop',
              clubId: 1,
              clubName: 'Tech Club',
              duty: 'Registration',
              state: 'ACTIVE',
            },
            {
              eventId: 11,
              eventName: 'Seminar',
              clubId: 2,
              clubName: 'Art Club',
              duty: 'Photography',
              state: 'ACTIVE',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyStaff()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/my/staff')
      expect(result).toHaveLength(2)
      expect(result[0].duty).toBe('Registration')
    })
  })

  describe('getStaffHistory', () => {
    it('should fetch staff approval history', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'History fetched',
          data: {
            content: [
              {
                orderId: 1,
                orderCode: 'ORD001',
                productName: 'T-Shirt',
                quantity: 2,
                totalPoints: 100,
                status: 'COMPLETED',
                createdAt: '2024-01-01T10:00:00Z',
                completedAt: '2024-01-01T12:00:00Z',
                productType: 'MERCHANDISE',
                clubId: 1,
                eventId: 10,
                clubName: 'Tech Club',
                memberName: 'John Doe',
                reasonRefund: '',
                errorImages: [],
              },
            ],
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getStaffHistory()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/redeem/my-approvals')
      expect(result).toHaveLength(1)
      expect(result[0].orderCode).toBe('ORD001')
    })

    it('should handle empty history', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No history',
          data: {
            content: [],
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getStaffHistory()

      expect(result).toEqual([])
    })
  })
})
