import axiosInstance from '@/lib/axiosInstance'
import {
  getClubActivityReport,
} from '@/service/clubActivityReportApi'

jest.mock('@/lib/axiosInstance')

describe('ClubActivityReportApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getClubActivityReport', () => {
    it('should fetch club activity report', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Report fetched',
          data: {
            clubId: 1,
            clubName: 'Tech Club',
            year: 2024,
            month: 1,
            totalEvents: 10,
            avgFeedback: 4.5,
            avgCheckinRate: 0.85,
            avgMemberActivityScore: 75.0,
            staffPerformanceScore: 80.0,
            awardScore: 90.0,
            awardLevel: 'GOLD',
            finalScore: 85.0,
            rewardPoints: 500,
            locked: false,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivityReport({ clubId: 1, year: 2024, month: 1 })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/club-activity/1', {
        params: { year: 2024, month: 1 },
      })
      expect(result.clubName).toBe('Tech Club')
      expect(result.awardLevel).toBe('GOLD')
    })

    it('should handle low activity report', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Report fetched',
          data: {
            clubId: 2,
            clubName: 'Inactive Club',
            year: 2024,
            month: 1,
            totalEvents: 2,
            avgFeedback: 3.0,
            avgCheckinRate: 0.5,
            avgMemberActivityScore: 30.0,
            staffPerformanceScore: 40.0,
            awardScore: 35.0,
            awardLevel: 'BRONZE',
            finalScore: 35.0,
            rewardPoints: 100,
            locked: false,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivityReport({ clubId: 2, year: 2024, month: 1 })

      expect(result.totalEvents).toBe(2)
      expect(result.awardLevel).toBe('BRONZE')
      expect(result.finalScore).toBe(35.0)
    })

    it('should handle locked report', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Report fetched',
          data: {
            clubId: 1,
            clubName: 'Tech Club',
            year: 2023,
            month: 12,
            totalEvents: 10,
            avgFeedback: 4.5,
            avgCheckinRate: 0.85,
            avgMemberActivityScore: 75.0,
            staffPerformanceScore: 80.0,
            awardScore: 90.0,
            awardLevel: 'GOLD',
            finalScore: 85.0,
            rewardPoints: 500,
            locked: true,
            lockedAt: '2024-01-01T10:00:00Z',
            lockedBy: 'admin',
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivityReport({ clubId: 1, year: 2023, month: 12 })

      expect(result.locked).toBe(true)
      expect(result.lockedAt).toBeTruthy()
      expect(result.lockedBy).toBe('admin')
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(
        getClubActivityReport({ clubId: 999, year: 2024, month: 1 })
      ).rejects.toBeTruthy()
    })

    it('should handle no data for period', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'No activity data for this period' },
        },
      })

      await expect(
        getClubActivityReport({ clubId: 1, year: 2020, month: 1 })
      ).rejects.toBeTruthy()
    })

    it('should handle invalid month', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid month' },
        },
      })

      await expect(
        getClubActivityReport({ clubId: 1, year: 2024, month: 13 })
      ).rejects.toBeTruthy()
    })

    it('should handle perfect score report', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Report fetched',
          data: {
            clubId: 1,
            clubName: 'Perfect Club',
            year: 2024,
            month: 1,
            totalEvents: 20,
            avgFeedback: 5.0,
            avgCheckinRate: 1.0,
            avgMemberActivityScore: 100.0,
            staffPerformanceScore: 100.0,
            awardScore: 100.0,
            awardLevel: 'PLATINUM',
            finalScore: 100.0,
            rewardPoints: 1000,
            locked: false,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivityReport({ clubId: 1, year: 2024, month: 1 })

      expect(result.avgFeedback).toBe(5.0)
      expect(result.avgCheckinRate).toBe(1.0)
      expect(result.finalScore).toBe(100.0)
      expect(result.awardLevel).toBe('PLATINUM')
    })

    it('should handle zero events report', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Report fetched',
          data: {
            clubId: 3,
            clubName: 'New Club',
            year: 2024,
            month: 1,
            totalEvents: 0,
            avgFeedback: 0,
            avgCheckinRate: 0,
            avgMemberActivityScore: 0,
            staffPerformanceScore: 0,
            awardScore: 0,
            awardLevel: 'NONE',
            finalScore: 0,
            rewardPoints: 0,
            locked: false,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubActivityReport({ clubId: 3, year: 2024, month: 1 })

      expect(result.totalEvents).toBe(0)
      expect(result.finalScore).toBe(0)
      expect(result.rewardPoints).toBe(0)
    })
  })
})
