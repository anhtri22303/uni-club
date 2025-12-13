import axiosInstance from '@/lib/axiosInstance'
import {
  getClubApplications,
  getClubApplyById,
  postClubApplication,
  putClubApplicationStatus,
  getMyClubApply,
  processClubApplication,
  createClubAccount,
  sendOtp,
} from '@/service/clubApplicationAPI'

jest.mock('@/lib/axiosInstance')

describe('ClubApplicationAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getClubApplications', () => {
    it('should fetch all club applications', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Applications fetched',
          data: [
            {
              applicationId: 1,
              clubName: 'Tech Club',
              description: 'Technology enthusiasts',
              majorId: 1,
              majorName: 'Computer Science',
              status: 'PENDING',
              submittedAt: '2024-01-01T10:00:00Z',
              reviewedAt: null,
            },
            {
              applicationId: 2,
              clubName: 'Art Club',
              description: 'Art lovers',
              majorId: 2,
              majorName: 'Fine Arts',
              status: 'APPROVED',
              submittedAt: '2024-01-02T10:00:00Z',
              reviewedAt: '2024-01-03T10:00:00Z',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubApplications()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/club-applications/all')
      expect(result).toHaveLength(2)
      expect(result[0].clubName).toBe('Tech Club')
    })

    it('should handle empty applications', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No applications',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubApplications()

      expect(result).toEqual([])
    })
  })

  describe('getClubApplyById', () => {
    it('should fetch application by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Application fetched',
          data: {
            applicationId: 1,
            clubName: 'Tech Club',
            description: 'Technology enthusiasts',
            majorId: 1,
            majorName: 'Computer Science',
            vision: 'Empower tech skills',
            proposerReason: 'Need tech community',
            status: 'PENDING',
            submittedAt: '2024-01-01T10:00:00Z',
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getClubApplyById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/club-applications/1')
      expect(result.clubName).toBe('Tech Club')
      expect(result.vision).toBe('Empower tech skills')
    })

    it('should handle application not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Application not found' },
        },
      })

      await expect(getClubApplyById(999)).rejects.toBeTruthy()
    })
  })

  describe('postClubApplication', () => {
    it('should create club application with OTP', async () => {
      const applicationData = {
        clubName: 'New Club',
        description: 'New club description',
        majorId: 1,
        vision: 'Our vision',
        proposerReason: 'Need this club',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Application submitted',
          data: {
            applicationId: 1,
            ...applicationData,
            status: 'PENDING',
            submittedAt: '2024-01-01T10:00:00Z',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await postClubApplication(applicationData, '123456')

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/club-applications',
        applicationData,
        expect.objectContaining({
          params: { otp: '123456' },
        })
      )
      expect(result.clubName).toBe('New Club')
    })

    it('should handle invalid OTP', async () => {
      const applicationData = {
        clubName: 'New Club',
        description: 'Test',
        majorId: 1,
        vision: 'Test',
        proposerReason: 'Test',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid OTP' },
        },
      })

      await expect(postClubApplication(applicationData, 'invalid')).rejects.toBeTruthy()
    })
  })

  describe('putClubApplicationStatus', () => {
    it('should approve application', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          clubName: 'Tech Club',
          status: 'APPROVED',
          reviewedAt: '2024-01-02T10:00:00Z',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await putClubApplicationStatus(1, true, '')

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/club-applications/1/decide',
        { approve: true, rejectReason: '' },
        expect.any(Object)
      )
      expect(result.status).toBe('APPROVED')
    })

    it('should reject application with reason', async () => {
      const mockResponse = {
        data: {
          applicationId: 1,
          clubName: 'Tech Club',
          status: 'REJECTED',
          rejectReason: 'Insufficient information',
          reviewedAt: '2024-01-02T10:00:00Z',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await putClubApplicationStatus(1, false, 'Insufficient information')

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/club-applications/1/decide',
        { approve: false, rejectReason: 'Insufficient information' },
        expect.any(Object)
      )
      expect(result.status).toBe('REJECTED')
    })
  })

  describe('getMyClubApply', () => {
    it('should fetch my club applications', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'My applications',
          data: [
            {
              applicationId: 1,
              clubName: 'My Club',
              status: 'PENDING',
              submittedAt: '2024-01-01T10:00:00Z',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMyClubApply()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/club-applications/my')
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

      const result = await getMyClubApply()

      expect(result).toEqual([])
    })
  })

  describe('processClubApplication', () => {
    it('should process approval', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Application approved',
          data: {
            applicationId: 1,
            clubName: 'Tech Club',
            status: 'APPROVED',
          },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await processClubApplication(1, { approve: true })

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/club-applications/1/approve',
        { approve: true },
        expect.any(Object)
      )
      expect(result.status).toBe('APPROVED')
    })

    it('should process rejection', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Application rejected',
          data: {
            applicationId: 1,
            clubName: 'Tech Club',
            status: 'REJECTED',
          },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await processClubApplication(1, {
        approve: false,
        rejectReason: 'Not qualified',
      })

      expect(result.status).toBe('REJECTED')
    })
  })

  describe('createClubAccount', () => {
    it('should create club account', async () => {
      const accountData = {
        applicationId: 1,
        clubId: 10,
        leaderFullName: 'John Doe',
        leaderEmail: 'john@example.com',
        viceFullName: 'Jane Smith',
        viceEmail: 'jane@example.com',
        defaultPassword: 'Pass123!',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Accounts created',
          data: 'Club accounts created successfully',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createClubAccount(accountData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/club-applications/create-club-accounts',
        accountData,
        expect.any(Object)
      )
      expect(result).toBe('Club accounts created successfully')
    })

    it('should handle invalid email', async () => {
      const accountData = {
        applicationId: 1,
        clubId: 10,
        leaderFullName: 'John Doe',
        leaderEmail: 'invalid-email',
        viceFullName: 'Jane Smith',
        viceEmail: 'jane@example.com',
        defaultPassword: 'Pass123!',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid email format' },
        },
      })

      await expect(createClubAccount(accountData)).rejects.toBeTruthy()
    })
  })

  describe('sendOtp', () => {
    it('should send OTP to email', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'OTP sent',
          data: 'OTP sent successfully to john@example.com',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await sendOtp('john@example.com')

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/club-applications/send-otp',
        null,
        expect.objectContaining({
          params: { studentEmail: 'john@example.com' },
        })
      )
      expect(result).toContain('successfully')
    })

    it('should handle invalid email', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid email' },
        },
      })

      await expect(sendOtp('invalid-email')).rejects.toBeTruthy()
    })

    it('should handle email not found', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Email not registered' },
        },
      })

      await expect(sendOtp('notfound@example.com')).rejects.toBeTruthy()
    })
  })
})
