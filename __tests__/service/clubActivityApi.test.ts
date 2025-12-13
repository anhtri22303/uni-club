import axiosInstance from '@/lib/axiosInstance'
import {
  getClubActivitiesMonthly,
  getMemberActivityByMembershipId,
  recalculateClubActivities,
  getClubEventActivityMonthly,
} from '@/service/clubActivityApi'

jest.mock('@/lib/axiosInstance')

describe('ClubActivityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getClubActivitiesMonthly', () => {
    it('should fetch club activities for a month', async () => {
      const mockResponse = {
        success: true,
        message: 'Activities fetched',
        data: {
          clubId: 1,
          clubName: 'Tech Club',
          month: '2025-01',
          members: [
            {
              membershipId: 1,
              userId: 10,
              studentCode: 'STU001',
              fullName: 'John Doe',
              email: 'john@example.com',
              memberLevel: 'MEMBER',
              activityLevel: 'HIGH',
              activityMultiplier: 1.5,
              totalEvents: 10,
              attendedEvents: 9,
              eventParticipationRate: 0.9,
              totalSessions: 8,
              attendedSessions: 7,
              sessionRate: 0.875,
              staffScore: 95,
              penaltyPoints: 0,
              rawScore: 142.5,
            },
            {
              membershipId: 2,
              userId: 11,
              studentCode: 'STU002',
              fullName: 'Jane Smith',
              email: 'jane@example.com',
              memberLevel: 'MEMBER',
              activityLevel: 'MEDIUM',
              activityMultiplier: 1.0,
              totalEvents: 10,
              attendedEvents: 6,
              eventParticipationRate: 0.6,
              totalSessions: 8,
              attendedSessions: 5,
              sessionRate: 0.625,
              staffScore: 75,
              penaltyPoints: 5,
              rawScore: 70,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubActivitiesMonthly({ clubId: 1, month: '2025-01' })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/activities/monthly', {
        params: { month: '2025-01' },
      })
      expect(result.clubName).toBe('Tech Club')
      expect(result.members).toHaveLength(2)
      expect(result.members[0].activityLevel).toBe('HIGH')
    })

    it('should handle club with no members', async () => {
      const mockResponse = {
        success: true,
        message: 'Activities fetched',
        data: {
          clubId: 2,
          clubName: 'New Club',
          month: '2025-01',
          members: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubActivitiesMonthly({ clubId: 2, month: '2025-01' })

      expect(result.members).toEqual([])
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(
        getClubActivitiesMonthly({ clubId: 999, month: '2025-01' })
      ).rejects.toBeTruthy()
    })

    it('should handle invalid month format', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid month format' },
        },
      })

      await expect(
        getClubActivitiesMonthly({ clubId: 1, month: 'invalid' })
      ).rejects.toBeTruthy()
    })
  })

  describe('getMemberActivityByMembershipId', () => {
    it('should fetch member activity by membership id', async () => {
      const mockResponse = {
        success: true,
        message: 'Member activity fetched',
        data: {
          membershipId: 1,
          clubId: 1,
          clubName: 'Tech Club',
          month: '2025-01',
          userId: 10,
          studentCode: 'STU001',
          fullName: 'John Doe',
          email: 'john@example.com',
          memberLevel: 'MEMBER',
          activityLevel: 'HIGH',
          activityMultiplier: 1.5,
          totalEvents: 10,
          attendedEvents: 9,
          eventParticipationRate: 0.9,
          totalSessions: 8,
          attendedSessions: 7,
          sessionRate: 0.875,
          staffScore: 95,
          penaltyPoints: 0,
          rawScore: 142.5,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMemberActivityByMembershipId({
        membershipId: 1,
        month: '2025-01',
      })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/memberships/1/activity', {
        params: { month: '2025-01' },
      })
      expect(result.fullName).toBe('John Doe')
      expect(result.activityLevel).toBe('HIGH')
      expect(result.rawScore).toBe(142.5)
    })

    it('should fetch low activity member', async () => {
      const mockResponse = {
        success: true,
        message: 'Member activity fetched',
        data: {
          membershipId: 3,
          clubId: 1,
          clubName: 'Tech Club',
          month: '2025-01',
          userId: 12,
          studentCode: 'STU003',
          fullName: 'Bob Wilson',
          email: 'bob@example.com',
          memberLevel: 'MEMBER',
          activityLevel: 'LOW',
          activityMultiplier: 0.5,
          totalEvents: 10,
          attendedEvents: 2,
          eventParticipationRate: 0.2,
          totalSessions: 8,
          attendedSessions: 1,
          sessionRate: 0.125,
          staffScore: 30,
          penaltyPoints: 10,
          rawScore: 15,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMemberActivityByMembershipId({
        membershipId: 3,
        month: '2025-01',
      })

      expect(result.activityLevel).toBe('LOW')
      expect(result.penaltyPoints).toBe(10)
    })

    it('should handle membership not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Membership not found' },
        },
      })

      await expect(
        getMemberActivityByMembershipId({ membershipId: 999, month: '2025-01' })
      ).rejects.toBeTruthy()
    })
  })

  describe('recalculateClubActivities', () => {
    it('should recalculate club activities successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Activities recalculated',
        data: {},
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      await recalculateClubActivities({ clubId: 1, month: '2025-01' })

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/clubs/1/activities/recalculate',
        {},
        {
          params: { month: '2025-01' },
        }
      )
    })

    it('should handle recalculation failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Recalculation failed',
        data: null,
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      await expect(
        recalculateClubActivities({ clubId: 1, month: '2025-01' })
      ).rejects.toBeTruthy()
    })

    it('should handle unauthorized access', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Not authorized' },
        },
      })

      await expect(
        recalculateClubActivities({ clubId: 1, month: '2025-01' })
      ).rejects.toBeTruthy()
    })
  })

  describe('getClubEventActivityMonthly', () => {
    it('should fetch club event activity for a month', async () => {
      const mockResponse = {
        success: true,
        message: 'Event activity fetched',
        data: {
          clubId: 1,
          year: 2025,
          month: 1,
          totalEvents: 10,
          completedEvents: 8,
          rejectedEvents: 1,
          activityLevel: 'HIGH',
          multiplier: 1.5,
          finalScore: 120,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubEventActivityMonthly({ clubId: 1, month: '2025-01' })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/event-activity/monthly', {
        params: { month: '2025-01' },
      })
      expect(result.totalEvents).toBe(10)
      expect(result.activityLevel).toBe('HIGH')
      expect(result.finalScore).toBe(120)
    })

    it('should fetch medium activity club', async () => {
      const mockResponse = {
        success: true,
        message: 'Event activity fetched',
        data: {
          clubId: 2,
          year: 2025,
          month: 1,
          totalEvents: 5,
          completedEvents: 4,
          rejectedEvents: 0,
          activityLevel: 'MEDIUM',
          multiplier: 1.0,
          finalScore: 60,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubEventActivityMonthly({ clubId: 2, month: '2025-01' })

      expect(result.activityLevel).toBe('MEDIUM')
      expect(result.multiplier).toBe(1.0)
    })

    it('should fetch low activity club', async () => {
      const mockResponse = {
        success: true,
        message: 'Event activity fetched',
        data: {
          clubId: 3,
          year: 2025,
          month: 1,
          totalEvents: 2,
          completedEvents: 1,
          rejectedEvents: 1,
          activityLevel: 'LOW',
          multiplier: 0.5,
          finalScore: 10,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubEventActivityMonthly({ clubId: 3, month: '2025-01' })

      expect(result.activityLevel).toBe('LOW')
      expect(result.completedEvents).toBe(1)
      expect(result.rejectedEvents).toBe(1)
    })

    it('should handle club with no events', async () => {
      const mockResponse = {
        success: true,
        message: 'Event activity fetched',
        data: {
          clubId: 4,
          year: 2025,
          month: 1,
          totalEvents: 0,
          completedEvents: 0,
          rejectedEvents: 0,
          activityLevel: 'UNKNOWN',
          multiplier: 1.0,
          finalScore: 0,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubEventActivityMonthly({ clubId: 4, month: '2025-01' })

      expect(result.totalEvents).toBe(0)
      expect(result.activityLevel).toBe('UNKNOWN')
    })

    it('should handle unauthorized staff access', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Only UNIVERSITY_STAFF can access this' },
        },
      })

      await expect(
        getClubEventActivityMonthly({ clubId: 1, month: '2025-01' })
      ).rejects.toBeTruthy()
    })
  })
})
