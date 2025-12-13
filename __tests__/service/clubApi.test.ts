import axiosInstance from '@/lib/axiosInstance'
import {
  fetchClub,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
} from '@/service/clubApi'

// Mock axios instance
jest.mock('@/lib/axiosInstance')

describe('ClubApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchClub', () => {
    it('should fetch clubs successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: {
          content: [
            { id: 1, name: 'Club 1', description: 'Description 1', majorId: 1, majorName: 'Major 1', leaderId: 1, leaderName: 'Leader 1' },
            { id: 2, name: 'Club 2', description: 'Description 2', majorId: 2, majorName: 'Major 2', leaderId: 2, leaderName: 'Leader 2' },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchClub()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs', {
        params: { page: 0, size: 70, sort: 'name' }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle empty clubs list', async () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: { content: [] },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await fetchClub()

      expect(result.data.content).toEqual([])
    })

    it('should handle network errors', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await expect(fetchClub()).rejects.toThrow('Network error')
    })
  })

  describe('getClubById', () => {
    it('should fetch club by id successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: {
          id: 1,
          name: 'Club 1',
          description: 'Description 1',
          majorId: 1,
          majorName: 'Major 1',
          leaderId: 1,
          leaderName: 'Leader 1'
        }
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1')
      expect(result).toEqual(mockResponse)
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: { status: 404, data: { message: 'Club not found' } },
      })

      await expect(getClubById(999)).rejects.toBeTruthy()
    })
  })

  describe('createClub', () => {
    it('should create club successfully', async () => {
      const mockClubData = {
        name: 'New Club',
        description: 'New club description',
      }
      const mockResponse = {
        success: true,
        message: 'Club created',
        data: { id: 3, ...mockClubData }
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await createClub(mockClubData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/clubs', mockClubData)
      expect(result).toHaveProperty('data.id')
    })

    it('should handle validation errors', async () => {
      const mockClubData = { name: '', description: '' }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 400, data: { message: 'Name is required' } },
      })

      await expect(createClub(mockClubData)).rejects.toBeTruthy()
    })
  })

  describe('updateClub', () => {
    it('should update club successfully', async () => {
      const mockClubData = {
        name: 'Updated Club',
        description: 'Updated description',
      }
      const mockResponse = {
        success: true,
        message: 'Club updated',
        data: { id: 1, ...mockClubData }
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateClub(1, mockClubData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/clubs/1', mockClubData)
      expect(result).toHaveProperty('data.id')
    })

    it('should handle unauthorized update', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: { status: 403, data: { message: 'Unauthorized' } },
      })

      await expect(updateClub(1, {})).rejects.toBeTruthy()
    })
  })

  describe('deleteClub', () => {
    it('should delete club successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Club deleted'
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await deleteClub(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/clubs/1')
      expect(result).toHaveProperty('success', true)
    })

    it('should handle errors when deleting', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } },
      })

      await expect(deleteClub(1)).rejects.toBeTruthy()
    })
  })
})
