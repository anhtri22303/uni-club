import axiosInstance from '@/lib/axiosInstance'

jest.mock('@/lib/axiosInstance')

// Mock functions from memberActivityReportApi
const getClubActivitySummary = async (params: { clubId: number; year: number; month: number }) => {
  const response = await axiosInstance.get(`/api/clubs/${params.clubId}/activity/summary`, {
    params: { year: params.year, month: params.month },
  })
  return response.data.data
}

const getLiveActivity = async (params: { clubId: number; attendanceBase?: number; staffBase?: number }) => {
  const response = await axiosInstance.get(`/api/clubs/${params.clubId}/members/activity-live`, {
    params: { attendanceBase: params.attendanceBase, staffBase: params.staffBase },
  })
  return response.data.data
}

describe('MemberActivityReportApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getClubActivitySummary', () => {
    it('should fetch club activity summary', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Summary fetched',
          data: {
            clubId: 1,
            clubName: 'Tech Club',
            year: 2024,
            month: 1,
            totalEventsCompleted: 10,
            memberCount: 50,
            fullMembersCount: 45,
            memberOfMonth: {
              membershipId: 5,
              userId: 10,
              fullName: 'John Doe',
              studentCode: 'STU001',
              clubId: 1,
              clubName: 'Tech Club',
              year: 2024,
              month: 1,
              totalEventRegistered: 10,
              totalEventAttended: 10,
              eventAttendanceRate: 1.0,
              totalPenaltyPoints: 0,
              activityLevel: 'HIGH',
              attendanceBaseScore: 100,
              attendanceMultiplier: 1.5,
              attendanceTotalScore: 150,
              staffBaseScore: 100,
              totalStaffCount: 5,
              staffEvaluation: 'EXCELLENT',
              staffMultiplier: 1.5,
              staffScore: 100,
              staffTotalScore: 150,
              totalClubSessions: 8,
              totalClubPresent: 8,
              sessionAttendanceRate: 1.0,
              finalScore: 300,
            },
            clubMultiplier: 1.2,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivitySummary({ clubId: 1, year: 2024, month: 1 })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/activity/summary', {
        params: { year: 2024, month: 1 },
      })
      expect(result.clubName).toBe('Tech Club')
      expect(result.memberOfMonth.fullName).toBe('John Doe')
    })

    it('should handle low activity summary', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Summary fetched',
          data: {
            clubId: 2,
            clubName: 'Inactive Club',
            year: 2024,
            month: 1,
            totalEventsCompleted: 2,
            memberCount: 10,
            fullMembersCount: 5,
            memberOfMonth: {
              membershipId: 3,
              userId: 8,
              fullName: 'Jane Smith',
              studentCode: 'STU002',
              clubId: 2,
              clubName: 'Inactive Club',
              year: 2024,
              month: 1,
              totalEventRegistered: 2,
              totalEventAttended: 2,
              eventAttendanceRate: 1.0,
              totalPenaltyPoints: 10,
              activityLevel: 'LOW',
              attendanceBaseScore: 50,
              attendanceMultiplier: 0.8,
              attendanceTotalScore: 40,
              staffBaseScore: 0,
              totalStaffCount: 0,
              staffEvaluation: 'UNKNOWN',
              staffMultiplier: 1.0,
              staffScore: 0,
              staffTotalScore: 0,
              totalClubSessions: 4,
              totalClubPresent: 2,
              sessionAttendanceRate: 0.5,
              finalScore: 40,
            },
            clubMultiplier: 0.8,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivitySummary({ clubId: 2, year: 2024, month: 1 })

      expect(result.totalEventsCompleted).toBe(2)
      expect(result.memberOfMonth.activityLevel).toBe('LOW')
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(
        getClubActivitySummary({ clubId: 999, year: 2024, month: 1 })
      ).rejects.toBeTruthy()
    })
  })

  describe('getLiveActivity', () => {
    it('should fetch live activity with default base scores', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Live activity fetched',
          data: [
            {
              membershipId: 1,
              userId: 5,
              fullName: 'John Doe',
              studentCode: 'STU001',
              clubId: 1,
              clubName: 'Tech Club',
              year: 2024,
              month: 1,
              totalEventRegistered: 8,
              totalEventAttended: 7,
              eventAttendanceRate: 0.875,
              totalPenaltyPoints: 5,
              activityLevel: 'HIGH',
              attendanceBaseScore: 100,
              attendanceMultiplier: 1.5,
              attendanceTotalScore: 150,
              staffBaseScore: 100,
              totalStaffCount: 3,
              staffEvaluation: 'GOOD',
              staffMultiplier: 1.2,
              staffScore: 100,
              staffTotalScore: 120,
              totalClubSessions: 6,
              totalClubPresent: 5,
              sessionAttendanceRate: 0.833,
              finalScore: 270,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getLiveActivity({ clubId: 1 })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/members/activity-live', {
        params: { attendanceBase: undefined, staffBase: undefined },
      })
      expect(result).toHaveLength(1)
      expect(result[0].activityLevel).toBe('HIGH')
    })

    it('should fetch live activity with custom base scores', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Live activity fetched',
          data: [
            {
              membershipId: 1,
              userId: 5,
              fullName: 'John Doe',
              studentCode: 'STU001',
              clubId: 1,
              clubName: 'Tech Club',
              year: 2024,
              month: 1,
              totalEventRegistered: 8,
              totalEventAttended: 7,
              eventAttendanceRate: 0.875,
              totalPenaltyPoints: 5,
              activityLevel: 'HIGH',
              attendanceBaseScore: 200,
              attendanceMultiplier: 1.5,
              attendanceTotalScore: 300,
              staffBaseScore: 150,
              totalStaffCount: 3,
              staffEvaluation: 'GOOD',
              staffMultiplier: 1.2,
              staffScore: 150,
              staffTotalScore: 180,
              totalClubSessions: 6,
              totalClubPresent: 5,
              sessionAttendanceRate: 0.833,
              finalScore: 480,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getLiveActivity({ clubId: 1, attendanceBase: 200, staffBase: 150 })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/members/activity-live', {
        params: { attendanceBase: 200, staffBase: 150 },
      })
      expect(result[0].attendanceBaseScore).toBe(200)
      expect(result[0].staffBaseScore).toBe(150)
    })

    it('should handle empty member list', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No members',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getLiveActivity({ clubId: 1 })

      expect(result).toEqual([])
    })

    it('should handle members with penalties', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Live activity fetched',
          data: [
            {
              membershipId: 2,
              userId: 6,
              fullName: 'Jane Smith',
              studentCode: 'STU002',
              clubId: 1,
              clubName: 'Tech Club',
              year: 2024,
              month: 1,
              totalEventRegistered: 5,
              totalEventAttended: 3,
              eventAttendanceRate: 0.6,
              totalPenaltyPoints: 30,
              activityLevel: 'MEDIUM',
              attendanceBaseScore: 100,
              attendanceMultiplier: 1.0,
              attendanceTotalScore: 100,
              staffBaseScore: 100,
              totalStaffCount: 1,
              staffEvaluation: 'AVERAGE',
              staffMultiplier: 1.0,
              staffScore: 100,
              staffTotalScore: 100,
              totalClubSessions: 4,
              totalClubPresent: 2,
              sessionAttendanceRate: 0.5,
              finalScore: 170,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getLiveActivity({ clubId: 1 })

      expect(result[0].totalPenaltyPoints).toBe(30)
      expect(result[0].activityLevel).toBe('MEDIUM')
    })

    it('should handle members with no staff activity', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Live activity fetched',
          data: [
            {
              membershipId: 3,
              userId: 7,
              fullName: 'Bob Wilson',
              studentCode: 'STU003',
              clubId: 1,
              clubName: 'Tech Club',
              year: 2024,
              month: 1,
              totalEventRegistered: 5,
              totalEventAttended: 5,
              eventAttendanceRate: 1.0,
              totalPenaltyPoints: 0,
              activityLevel: 'HIGH',
              attendanceBaseScore: 100,
              attendanceMultiplier: 1.5,
              attendanceTotalScore: 150,
              staffBaseScore: 100,
              totalStaffCount: 0,
              staffEvaluation: 'UNKNOWN',
              staffMultiplier: 1.0,
              staffScore: 0,
              staffTotalScore: 0,
              totalClubSessions: 4,
              totalClubPresent: 4,
              sessionAttendanceRate: 1.0,
              finalScore: 150,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getLiveActivity({ clubId: 1 })

      expect(result[0].totalStaffCount).toBe(0)
      expect(result[0].staffTotalScore).toBe(0)
      expect(result[0].staffEvaluation).toBe('UNKNOWN')
    })
  })
})
