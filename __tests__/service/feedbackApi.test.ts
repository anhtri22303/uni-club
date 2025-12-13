import axiosInstance from '@/lib/axiosInstance'
import {
  getMyFeedbackByMembershipId,
  getFeedbackByEventId,
  getFeedbackByClubId,
  postFeedback,
  getMyFeedbacks,
  putFeedback,
} from '@/service/feedbackApi'

jest.mock('@/lib/axiosInstance')

describe('FeedbackApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMyFeedbackByMembershipId', () => {
    it('should fetch feedbacks by membership id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Feedbacks fetched',
          data: [
            {
              feedbackId: 1,
              eventId: 10,
              eventName: 'Tech Workshop',
              clubName: 'Tech Club',
              membershipId: 5,
              rating: 5,
              comment: 'Excellent event!',
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: null,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyFeedbackByMembershipId(5)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/memberships/5/feedbacks')
      expect(result).toHaveLength(1)
      expect(result[0].rating).toBe(5)
    })

    it('should handle no feedbacks', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No feedbacks',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyFeedbackByMembershipId(10)

      expect(result).toEqual([])
    })
  })

  describe('getFeedbackByEventId', () => {
    it('should fetch feedbacks for event', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Feedbacks fetched',
          data: [
            {
              feedbackId: 1,
              eventId: 10,
              eventName: 'Workshop',
              clubName: 'Tech Club',
              memberName: 'John Doe',
              membershipId: 5,
              rating: 4,
              comment: 'Good event',
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: null,
            },
            {
              feedbackId: 2,
              eventId: 10,
              eventName: 'Workshop',
              clubName: 'Tech Club',
              memberName: 'Jane Smith',
              membershipId: 6,
              rating: 5,
              comment: 'Amazing!',
              createdAt: '2024-01-01T11:00:00Z',
              updatedAt: null,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getFeedbackByEventId(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/10/feedback')
      expect(result).toHaveLength(2)
      expect(result[0].rating).toBe(4)
      expect(result[1].rating).toBe(5)
    })

    it('should handle event not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      })

      await expect(getFeedbackByEventId(999)).rejects.toBeTruthy()
    })
  })

  describe('getFeedbackByClubId', () => {
    it('should fetch feedbacks for club', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Feedbacks fetched',
          data: [
            {
              feedbackId: 1,
              eventId: 10,
              eventName: 'Workshop 1',
              clubName: 'Tech Club',
              membershipId: 5,
              rating: 4,
              comment: 'Good',
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: null,
            },
            {
              feedbackId: 2,
              eventId: 11,
              eventName: 'Workshop 2',
              clubName: 'Tech Club',
              membershipId: 6,
              rating: 5,
              comment: 'Great',
              createdAt: '2024-01-02T10:00:00Z',
              updatedAt: null,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getFeedbackByClubId(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/clubs/1/feedbacks')
      expect(result).toHaveLength(2)
      expect(result[0].clubName).toBe('Tech Club')
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(getFeedbackByClubId(999)).rejects.toBeTruthy()
    })
  })

  describe('postFeedback', () => {
    it('should post feedback with rating 5', async () => {
      const feedbackData = {
        rating: 5,
        comment: 'Excellent event!',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Feedback posted',
          data: {
            feedbackId: 1,
            eventId: 10,
            eventName: 'Workshop',
            clubName: 'Tech Club',
            membershipId: 5,
            rating: 5,
            comment: 'Excellent event!',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: null,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await postFeedback(10, feedbackData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/events/10/feedback', feedbackData)
      expect(result.rating).toBe(5)
      expect(result.comment).toBe('Excellent event!')
    })

    it('should post feedback with rating 1', async () => {
      const feedbackData = {
        rating: 1,
        comment: 'Not good',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Feedback posted',
          data: {
            feedbackId: 2,
            eventId: 10,
            eventName: 'Workshop',
            clubName: 'Tech Club',
            membershipId: 5,
            rating: 1,
            comment: 'Not good',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: null,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await postFeedback(10, feedbackData)

      expect(result.rating).toBe(1)
    })

    it('should handle invalid rating', async () => {
      const feedbackData = {
        rating: 6,
        comment: 'Invalid',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Rating must be between 1 and 5' },
        },
      })

      await expect(postFeedback(10, feedbackData)).rejects.toBeTruthy()
    })

    it('should handle duplicate feedback', async () => {
      const feedbackData = {
        rating: 4,
        comment: 'Duplicate',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Feedback already exists' },
        },
      })

      await expect(postFeedback(10, feedbackData)).rejects.toBeTruthy()
    })
  })

  describe('getMyFeedbacks', () => {
    it('should fetch current user feedbacks', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'My feedbacks',
          data: [
            {
              feedbackId: 1,
              eventId: 10,
              eventName: 'Workshop 1',
              clubName: 'Tech Club',
              membershipId: 5,
              rating: 5,
              comment: 'Great!',
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: null,
            },
            {
              feedbackId: 2,
              eventId: 11,
              eventName: 'Workshop 2',
              clubName: 'Art Club',
              membershipId: 6,
              rating: 4,
              comment: 'Good',
              createdAt: '2024-01-02T10:00:00Z',
              updatedAt: null,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyFeedbacks()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/my-feedbacks')
      expect(result).toHaveLength(2)
    })

    it('should handle no feedbacks', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No feedbacks',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyFeedbacks()

      expect(result).toEqual([])
    })
  })

  describe('putFeedback', () => {
    it('should update feedback', async () => {
      const feedbackData = {
        rating: 4,
        comment: 'Updated comment',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Feedback updated',
          data: {
            feedbackId: 1,
            eventId: 10,
            eventName: 'Workshop',
            clubName: 'Tech Club',
            membershipId: 5,
            rating: 4,
            comment: 'Updated comment',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-02T10:00:00Z',
          },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await putFeedback(1, feedbackData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/events/feedback/1', feedbackData)
      expect(result.rating).toBe(4)
      expect(result.comment).toBe('Updated comment')
      expect(result.updatedAt).not.toBeNull()
    })

    it('should handle feedback not found', async () => {
      const feedbackData = {
        rating: 5,
        comment: 'Update',
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Feedback not found' },
        },
      })

      await expect(putFeedback(999, feedbackData)).rejects.toBeTruthy()
    })

    it('should handle unauthorized update', async () => {
      const feedbackData = {
        rating: 5,
        comment: 'Unauthorized',
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Cannot update other user feedback' },
        },
      })

      await expect(putFeedback(1, feedbackData)).rejects.toBeTruthy()
    })
  })
})
