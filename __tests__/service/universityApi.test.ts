import axiosInstance from '@/lib/axiosInstance'
import {
  fetchUniversityPoints,
  fetchAttendanceSummary,
  fetchAttendanceRanking,
  fetchClubOverview,
  fetchClubOverviewByMonth,
} from '@/service/universityApi'

jest.mock('@/lib/axiosInstance')

describe('UniversityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchUniversityPoints', () => {
    it('should fetch university points with wrapped response', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Points fetched',
          data: {
            totalUniversityPoints: 5000,
            clubRankings: [
              { rank: 1, clubId: 1, clubName: 'Tech Club', totalPoints: 2000 },
              { rank: 2, clubId: 2, clubName: 'Art Club', totalPoints: 1500 },
              { rank: 3, clubId: 3, clubName: 'Sports Club', totalPoints: 1000 },
            ],
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchUniversityPoints()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/points')
      expect(result.totalUniversityPoints).toBe(5000)
      expect(result.clubRankings).toHaveLength(3)
      expect(result.clubRankings[0].rank).toBe(1)
    })

    it('should fetch university points with direct response', async () => {
      const mockResponse = {
        data: {
          totalUniversityPoints: 3000,
          clubRankings: [
            { rank: 1, clubId: 5, clubName: 'Music Club', totalPoints: 1800 },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchUniversityPoints()

      expect(result.totalUniversityPoints).toBe(3000)
      expect(result.clubRankings).toHaveLength(1)
    })

    it('should handle empty rankings', async () => {
      const mockResponse = {
        data: {
          totalUniversityPoints: 0,
          clubRankings: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchUniversityPoints()

      expect(result.totalUniversityPoints).toBe(0)
      expect(result.clubRankings).toEqual([])
    })
  })

  describe('fetchAttendanceSummary', () => {
    it('should fetch attendance summary for a year', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Summary fetched',
          data: {
            year: 2025,
            monthlySummary: [
              { month: '2025-01', participantCount: 150 },
              { month: '2025-02', participantCount: 200 },
              { month: '2025-03', participantCount: 180 },
            ],
            clubId: null,
            eventId: null,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceSummary(2025)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/attendance-summary', {
        params: { year: 2025 },
      })
      expect(result.year).toBe(2025)
      expect(result.monthlySummary).toHaveLength(3)
      expect(result.monthlySummary[1].participantCount).toBe(200)
    })

    it('should fetch attendance summary with direct response', async () => {
      const mockResponse = {
        data: {
          year: 2024,
          monthlySummary: [
            { month: '2024-12', participantCount: 100 },
          ],
          clubId: null,
          eventId: null,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceSummary(2024)

      expect(result.year).toBe(2024)
      expect(result.monthlySummary).toHaveLength(1)
    })

    it('should handle year with no attendance', async () => {
      const mockResponse = {
        data: {
          year: 2023,
          monthlySummary: [],
          clubId: null,
          eventId: null,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceSummary(2023)

      expect(result.monthlySummary).toEqual([])
    })
  })

  describe('fetchAttendanceRanking', () => {
    it('should fetch attendance ranking with wrapped response', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Ranking fetched',
          data: {
            totalAttendances: 1000,
            clubRankings: [
              { rank: 1, clubId: 1, clubName: 'Tech Club', attendanceCount: 400 },
              { rank: 2, clubId: 2, clubName: 'Art Club', attendanceCount: 350 },
              { rank: 3, clubId: 3, clubName: 'Sports Club', attendanceCount: 250 },
            ],
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceRanking()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/attendance-ranking')
      expect(result.totalAttendances).toBe(1000)
      expect(result.clubRankings).toHaveLength(3)
      expect(result.clubRankings[0].attendanceCount).toBe(400)
    })

    it('should fetch attendance ranking with direct response', async () => {
      const mockResponse = {
        data: {
          totalAttendances: 500,
          clubRankings: [
            { rank: 1, clubId: 5, clubName: 'Music Club', attendanceCount: 300 },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceRanking()

      expect(result.totalAttendances).toBe(500)
      expect(result.clubRankings).toHaveLength(1)
    })
  })

  describe('fetchClubOverview', () => {
    it('should fetch all clubs overview', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Overview fetched',
          data: [
            {
              clubId: 1,
              clubName: 'Tech Club',
              ratingEvent: 4.5,
              totalCheckin: 500,
              checkinRate: 0.85,
              totalMember: 50,
              totalStaff: 5,
              totalBudgetEvent: 10,
              totalProductEvent: 8,
              totalDiscipline: 2,
              attendanceRate: 0.9,
            },
            {
              clubId: 2,
              clubName: 'Art Club',
              ratingEvent: 4.2,
              totalCheckin: 300,
              checkinRate: 0.8,
              totalMember: 30,
              totalStaff: 3,
              totalBudgetEvent: 6,
              totalProductEvent: 5,
              totalDiscipline: 1,
              attendanceRate: 0.85,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchClubOverview()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/overview/clubs')
      expect(result).toHaveLength(2)
      expect(result[0].clubName).toBe('Tech Club')
      expect(result[0].ratingEvent).toBe(4.5)
      expect(result[1].totalMember).toBe(30)
    })

    it('should handle empty overview', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchClubOverview()

      expect(result).toEqual([])
    })
  })

  describe('fetchClubOverviewByMonth', () => {
    it('should fetch clubs overview for specific month', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Monthly overview fetched',
          data: [
            {
              clubId: 1,
              clubName: 'Tech Club',
              ratingEvent: 4.7,
              totalCheckin: 150,
              checkinRate: 0.9,
              totalMember: 50,
              totalStaff: 5,
              totalBudgetEvent: 3,
              totalProductEvent: 2,
              totalDiscipline: 0,
              attendanceRate: 0.95,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchClubOverviewByMonth(2025, 1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/overview/clubs/month', {
        params: { year: 2025, month: 1 },
      })
      expect(result).toHaveLength(1)
      expect(result[0].totalBudgetEvent).toBe(3)
    })

    it('should fetch overview for different months', async () => {
      const mockResponse = {
        data: [
          {
            clubId: 3,
            clubName: 'Sports Club',
            ratingEvent: 4.0,
            totalCheckin: 200,
            checkinRate: 0.75,
            totalMember: 40,
            totalStaff: 4,
            totalBudgetEvent: 5,
            totalProductEvent: 4,
            totalDiscipline: 3,
            attendanceRate: 0.8,
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchClubOverviewByMonth(2024, 12)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/overview/clubs/month', {
        params: { year: 2024, month: 12 },
      })
      expect(result[0].clubName).toBe('Sports Club')
    })

    it('should handle month with no data', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchClubOverviewByMonth(2025, 6)

      expect(result).toEqual([])
    })
  })
})
