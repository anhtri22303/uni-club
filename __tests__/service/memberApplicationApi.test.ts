import axiosInstance from '@/lib/axiosInstance'
import {
  postMemAppli,
  getMemberApplications,
  getMyMemApply,
  fetchAllMemberApplications,
  approveMemberApplication,
  rejectMemberApplication,
  deleteMemberApplication,
  getMemberApplyByClubId,
} from '@/service/memberApplicationApi'

jest.mock('@/lib/axiosInstance')

describe('MemberApplicationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('postMemAppli', () => {
    it('should create member application', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          clubId: 10,
          clubName: 'Tech Club',
          applicantId: 5,
          applicantName: 'John Doe',
          applicantEmail: 'john@example.com',
          status: 'PENDING',
          message: 'I want to join',
          reason: '',
          handledById: 0,
          handledByName: '',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          studentCode: 'STU001',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await postMemAppli({ clubId: 10, message: 'I want to join' })

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/member-applications', {
        clubId: 10,
        message: 'I want to join',
      })
      expect(result.clubName).toBe('Tech Club')
      expect(result.status).toBe('PENDING')
    })

    it('should handle string club id', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          clubId: 10,
          clubName: 'Tech Club',
          applicantId: 5,
          applicantName: 'John Doe',
          applicantEmail: 'john@example.com',
          status: 'PENDING',
          message: 'Join request',
          reason: '',
          handledById: 0,
          handledByName: '',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          studentCode: 'STU001',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await postMemAppli({ clubId: '10', message: 'Join request' })

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/member-applications', {
        clubId: 10,
        message: 'Join request',
      })
      expect(result.clubId).toBe(10)
    })

    it('should handle duplicate application', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Application already exists' },
        },
      })

      await expect(postMemAppli({ clubId: 10, message: 'Test' })).rejects.toBeTruthy()
    })
  })

  describe('getMemberApplications', () => {
    it('should fetch all applications', async () => {
      const mockResponse = {
        data: [
          {
            applicationId: 1,
            clubId: 10,
            clubName: 'Tech Club',
            applicantName: 'John Doe',
            status: 'PENDING',
          },
          {
            applicationId: 2,
            clubId: 11,
            clubName: 'Art Club',
            applicantName: 'Jane Smith',
            status: 'APPROVED',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMemberApplications()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/member-applications')
      expect(result).toHaveLength(2)
    })
  })

  describe('getMyMemApply', () => {
    it('should fetch my applications', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'My applications',
          data: [
            {
              applicationId: 1,
              clubName: 'Tech Club',
              status: 'PENDING',
              createdAt: '2024-01-01T10:00:00Z',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyMemApply()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/member-applications/my')
      expect(result).toHaveLength(1)
    })

    it('should handle no applications', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No applications',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyMemApply()

      expect(result).toEqual([])
    })
  })

  describe('fetchAllMemberApplications', () => {
    it('should fetch all member applications', async () => {
      const mockResponse = {
        data: [
          {
            applicationId: 1,
            clubName: 'Tech Club',
            status: 'PENDING',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchAllMemberApplications()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/member-applications')
      expect(result).toBeTruthy()
    })
  })

  describe('approveMemberApplication', () => {
    it('should approve application', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          status: 'APPROVED',
          handledByName: 'Leader',
          updatedAt: '2024-01-02T10:00:00Z',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await approveMemberApplication(1)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/member-applications/1/status', {
        status: 'APPROVED',
        reason: 'Approved by club leader',
      })
      expect(result.status).toBe('APPROVED')
    })

    it('should handle application not found', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Application not found' },
        },
      })

      await expect(approveMemberApplication(999)).rejects.toBeTruthy()
    })
  })

  describe('rejectMemberApplication', () => {
    it('should reject application with reason', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          status: 'REJECTED',
          reason: 'Does not meet requirements',
          handledByName: 'Leader',
          updatedAt: '2024-01-02T10:00:00Z',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await rejectMemberApplication(1, 'Does not meet requirements')

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/member-applications/1/status', {
        status: 'REJECTED',
        reason: 'Does not meet requirements',
      })
      expect(result.status).toBe('REJECTED')
    })

    it('should handle empty reason', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          status: 'REJECTED',
          reason: '',
          updatedAt: '2024-01-02T10:00:00Z',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await rejectMemberApplication(1, '')

      expect(result.status).toBe('REJECTED')
    })
  })

  describe('deleteMemberApplication', () => {
    it('should delete application', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Application deleted',
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteMemberApplication(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/member-applications/1')
      expect(result.success).toBe(true)
    })

    it('should handle application not found', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Application not found' },
        },
      })

      await expect(deleteMemberApplication(999)).rejects.toBeTruthy()
    })
  })

  describe('getMemberApplyByClubId', () => {
    it('should fetch applications by club id with array response', async () => {
      const mockResponse = {
        data: [
          {
            applicationId: 1,
            clubId: 10,
            applicantName: 'John Doe',
            status: 'PENDING',
          },
          {
            applicationId: 2,
            clubId: 10,
            applicantName: 'Jane Smith',
            status: 'APPROVED',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMemberApplyByClubId(10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/member-applications/club/10')
      expect(result).toHaveLength(2)
    })

    it('should handle wrapped data response', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              applicationId: 1,
              clubId: 10,
              applicantName: 'John Doe',
              status: 'PENDING',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMemberApplyByClubId(10)

      expect(result).toHaveLength(1)
    })

    it('should handle content pagination response', async () => {
      const mockResponse = {
        data: {
          content: [
            {
              applicationId: 1,
              clubId: 10,
              applicantName: 'John Doe',
              status: 'PENDING',
            },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMemberApplyByClubId(10)

      expect(result).toHaveLength(1)
    })

    it('should handle no applications for club', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMemberApplyByClubId(10)

      expect(result).toEqual([])
    })

    it('should handle string club id', async () => {
      const mockResponse = {
        data: [
          {
            applicationId: 1,
            clubId: 10,
            status: 'PENDING',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMemberApplyByClubId('10')

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/member-applications/club/10')
      expect(result).toHaveLength(1)
    })
  })
})
