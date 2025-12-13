import axiosInstance from '@/lib/axiosInstance'
import {
  fetchUser,
  fetchProfile,
  fetchUserById,
  updateUserById,
  editProfile,
  deleteUserById,
  getUserStats,
  getProfileStats,
} from '@/service/userApi'

jest.mock('@/lib/axiosInstance')

describe('UserApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchUser', () => {
    it('should fetch all users successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [
            { id: 1, email: 'user1@example.com', fullName: 'User 1' },
            { id: 2, email: 'user2@example.com', fullName: 'User 2' },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchUser()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users', {
        params: { page: 0, size: 300, sort: 'fullName' },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle fetch errors', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await expect(fetchUser()).rejects.toThrow('Network error')
    })
  })

  describe('fetchProfile', () => {
    it('should fetch current user profile', async () => {
      const mockProfile = {
        success: true,
        data: {
          id: 1,
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '1234567890',
          avatarUrl: 'avatar.jpg',
          studentCode: 'ST001',
          majorName: 'Computer Science',
          role: 'STUDENT',
          clubs: [],
          wallet: null,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockProfile })

      const result = await fetchProfile()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/me')
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('email')
    })

    it('should return null on error', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      )

      const result = await fetchProfile()

      expect(result).toBeNull()
    })
  })

  describe('fetchUserById', () => {
    it('should fetch user by id', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          email: 'user@example.com',
          fullName: 'Test User',
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchUserById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/1')
      expect(result).toEqual(mockResponse)
    })

    it('should handle user not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      })

      await expect(fetchUserById(999)).rejects.toBeTruthy()
    })
  })

  describe('updateUserById', () => {
    it('should update user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User updated',
        data: {
          id: 1,
          fullName: 'Updated Name',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateUserById(1, { fullName: 'Updated Name' })

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/1', {
        fullName: 'Updated Name',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle unauthorized update', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Unauthorized' },
        },
      })

      await expect(updateUserById(1, {})).rejects.toBeTruthy()
    })
  })

  describe('editProfile', () => {
    it('should edit current user profile', async () => {
      const mockResponse = {
        success: true,
        message: 'Profile updated',
      }
      const profileData = {
        fullName: 'New Name',
        phone: '9876543210',
        bio: 'Updated bio',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await editProfile(profileData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/me', profileData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle validation errors', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid phone number' },
        },
      })

      await expect(
        editProfile({ phone: 'invalid' })
      ).rejects.toBeTruthy()
    })
  })

  describe('deleteUserById', () => {
    it('should delete user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User deleted',
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await deleteUserById(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/users/1')
      expect(result).toEqual(mockResponse)
    })

    it('should handle delete errors', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Cannot delete user' },
        },
      })

      await expect(deleteUserById(1)).rejects.toBeTruthy()
    })
  })

  describe('getUserStats', () => {
    it('should fetch user statistics', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalUsers: 100,
          activeUsers: 80,
          pendingUsers: 20,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getUserStats()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/stats')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getProfileStats', () => {
    it('should fetch profile statistics', async () => {
      const mockResponse = {
        success: true,
        data: {
          eventsAttended: 10,
          clubsJoined: 3,
          pointsEarned: 500,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getProfileStats()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/me/stats')
      expect(result).toHaveProperty('eventsAttended')
    })

    it('should return null on error', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Error fetching stats')
      )

      const result = await getProfileStats()

      expect(result).toBeNull()
    })
  })
})
