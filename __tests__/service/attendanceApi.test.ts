import axiosInstance from '@/lib/axiosInstance'
import {
  fetchAttendanceByDate,
  saveAttendanceRecords,
  createClubAttendanceSession,
  fetchTodayClubAttendance,
  markClubAttendance,
  markAllClubAttendance,
} from '@/service/attendanceApi'

jest.mock('@/lib/axiosInstance')

describe('AttendanceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchAttendanceByDate', () => {
    it('should fetch attendance records by date', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: 1, memberName: 'John', status: 'PRESENT', date: '2025-01-15' },
            { id: 2, memberName: 'Jane', status: 'ABSENT', date: '2025-01-15' },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceByDate('2025-01-15')

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/attendance?date=2025-01-15')
      expect(result.data).toHaveLength(2)
    })

    it('should handle no attendance records', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAttendanceByDate('2025-01-20')

      expect(result.data).toEqual([])
    })
  })

  describe('saveAttendanceRecords', () => {
    it('should save attendance records successfully', async () => {
      const records = [
        { membershipId: 1, status: 'PRESENT', note: 'On time' },
        { membershipId: 2, status: 'LATE', note: '10 min late' },
      ]
      const mockResponse = {
        data: {
          success: true,
          message: 'Attendance saved',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await saveAttendanceRecords(records)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/attendance', records)
      expect(result.success).toBe(true)
    })

    it('should handle empty records array', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No records to save',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await saveAttendanceRecords([])

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/attendance', [])
      expect(result.success).toBe(true)
    })
  })

  describe('createClubAttendanceSession', () => {
    it('should create attendance session successfully', async () => {
      const sessionData = {
        date: '2025-01-15',
        startTime: '09:00',
        endTime: '11:00',
        note: 'Weekly meeting',
      }
      const mockResponse = {
        data: {
          success: true,
          data: {
            sessionId: 1,
            ...sessionData,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createClubAttendanceSession(1, sessionData)

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.data.sessionId).toBe(1)
    })

    it('should handle invalid time range', async () => {
      const sessionData = {
        date: '2025-01-15',
        startTime: '11:00',
        endTime: '09:00',
        note: 'Invalid time',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'End time must be after start time' },
        },
      })

      await expect(createClubAttendanceSession(1, sessionData)).rejects.toBeTruthy()
    })
  })

  describe('fetchTodayClubAttendance', () => {
    it('should fetch today attendance for club', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            sessionId: 1,
            date: '2025-01-15',
            attendance: [
              { membershipId: 1, status: 'PRESENT' },
              { membershipId: 2, status: 'ABSENT' },
            ],
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchTodayClubAttendance(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/club-attendance/1/today')
      expect(result.data.attendance).toHaveLength(2)
    })

    it('should handle no session today', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'No attendance session today' },
        },
      })

      await expect(fetchTodayClubAttendance(1)).rejects.toBeTruthy()
    })
  })

  describe('markClubAttendance', () => {
    it('should mark individual attendance', async () => {
      const params = {
        sessionId: 1,
        membershipId: 1,
        status: 'PRESENT' as const,
        note: 'On time',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Attendance marked',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await markClubAttendance(params)

      expect(axiosInstance.put).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should mark late attendance', async () => {
      const params = {
        sessionId: 1,
        membershipId: 2,
        status: 'LATE' as const,
        note: '15 minutes late',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Marked as late',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await markClubAttendance(params)

      expect(result.success).toBe(true)
    })

    it('should mark excused absence', async () => {
      const params = {
        sessionId: 1,
        membershipId: 3,
        status: 'EXCUSED' as const,
        note: 'Medical leave',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Absence excused',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await markClubAttendance(params)

      expect(result.success).toBe(true)
    })
  })

  describe('markAllClubAttendance', () => {
    it('should mark all members present', async () => {
      const params = {
        sessionId: 1,
        status: 'PRESENT' as const,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'All marked present',
          data: { updatedCount: 25 },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await markAllClubAttendance(params)

      expect(axiosInstance.put).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should mark all members absent', async () => {
      const params = {
        sessionId: 1,
        status: 'ABSENT' as const,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'All marked absent',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await markAllClubAttendance(params)

      expect(result.success).toBe(true)
    })

    it('should handle session not found', async () => {
      const params = {
        sessionId: 999,
        status: 'PRESENT' as const,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Session not found' },
        },
      })

      await expect(markAllClubAttendance(params)).rejects.toBeTruthy()
    })
  })
})
