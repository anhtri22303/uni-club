import axiosInstance from '@/lib/axiosInstance'
import {
  fetchMajors,
  fetchMajorById,
  fetchMajorByCode,
  createMajor,
  updateMajorById,
  updateMajorColor,
  deleteMajorById,
} from '@/service/majorApi'

jest.mock('@/lib/axiosInstance')

describe('MajorApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchMajors', () => {
    it('should fetch all majors', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: 'Computer Science',
            description: 'CS program',
            majorCode: 'CS',
            active: true,
            colorHex: '#3B82F6',
            policies: [],
          },
          {
            id: 2,
            name: 'Business Administration',
            description: 'BA program',
            majorCode: 'BA',
            active: true,
            colorHex: '#10B981',
            policies: [],
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchMajors()

      expect(axiosInstance.get).toHaveBeenCalledWith('api/university/majors')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Computer Science')
      expect(result[0].colorHex).toBe('#3B82F6')
    })

    it('should handle empty majors', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchMajors()

      expect(result).toEqual([])
    })
  })

  describe('fetchMajorById', () => {
    it('should fetch major by id', async () => {
      const mockResponse = {
        data: {
          id: 1,
          name: 'Computer Science',
          description: 'CS program',
          majorCode: 'CS',
          active: true,
          colorHex: '#3B82F6',
          policies: [
            {
              id: 1,
              major: 'CS',
              policyName: 'Standard Policy',
              description: 'Default policy',
              maxClubJoin: 3,
              active: true,
              majorName: 'Computer Science',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchMajorById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('api/university/majors/1')
      expect(result.id).toBe(1)
      expect(result.policies).toHaveLength(1)
    })

    it('should handle major not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Major not found' },
        },
      })

      await expect(fetchMajorById(999)).rejects.toBeTruthy()
    })
  })

  describe('fetchMajorByCode', () => {
    it('should fetch major by code', async () => {
      const mockResponse = {
        data: {
          id: 2,
          name: 'Business Administration',
          description: 'BA program',
          majorCode: 'BA',
          active: true,
          colorHex: '#10B981',
          policies: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchMajorByCode('BA')

      expect(axiosInstance.get).toHaveBeenCalledWith('api/university/majors/code/BA')
      expect(result.majorCode).toBe('BA')
      expect(result.name).toBe('Business Administration')
    })

    it('should handle major code not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Major code not found' },
        },
      })

      await expect(fetchMajorByCode('INVALID')).rejects.toBeTruthy()
    })
  })

  describe('createMajor', () => {
    it('should create a new major', async () => {
      const newMajor = {
        name: 'Data Science',
        description: 'DS program',
        majorCode: 'DS',
        colorHex: '#8B5CF6',
      }
      const mockResponse = {
        data: {
          id: 3,
          ...newMajor,
          active: true,
          policies: [],
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createMajor(newMajor)

      expect(axiosInstance.post).toHaveBeenCalledWith('api/university/majors', newMajor)
      expect(result.id).toBe(3)
      expect(result.name).toBe('Data Science')
      expect(result.colorHex).toBe('#8B5CF6')
    })

    it('should handle duplicate major code', async () => {
      const duplicateMajor = {
        name: 'Computer Science 2',
        description: 'Duplicate',
        majorCode: 'CS',
        colorHex: '#3B82F6',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Major code already exists' },
        },
      })

      await expect(createMajor(duplicateMajor)).rejects.toBeTruthy()
    })

    it('should handle invalid color hex', async () => {
      const invalidMajor = {
        name: 'Invalid Major',
        description: 'Test',
        majorCode: 'INV',
        colorHex: 'invalid',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid color hex format' },
        },
      })

      await expect(createMajor(invalidMajor)).rejects.toBeTruthy()
    })
  })

  describe('updateMajorById', () => {
    it('should update major successfully', async () => {
      const updateData = {
        name: 'Updated CS',
        description: 'Updated description',
        majorCode: 'CS',
        active: true,
        colorHex: '#6366F1',
      }
      const mockResponse = {
        data: {
          id: 1,
          ...updateData,
          policies: [],
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMajorById(1, updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('api/university/majors/1', updateData)
      expect(result.name).toBe('Updated CS')
      expect(result.colorHex).toBe('#6366F1')
    })

    it('should deactivate major', async () => {
      const updateData = {
        name: 'Computer Science',
        description: 'CS program',
        majorCode: 'CS',
        active: false,
        colorHex: '#3B82F6',
      }
      const mockResponse = {
        data: {
          id: 1,
          ...updateData,
          policies: [],
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMajorById(1, updateData)

      expect(result.active).toBe(false)
    })

    it('should handle major not found on update', async () => {
      const updateData = {
        name: 'Not Found',
        description: 'Test',
        majorCode: 'NF',
        active: true,
        colorHex: '#000000',
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Major not found' },
        },
      })

      await expect(updateMajorById(999, updateData)).rejects.toBeTruthy()
    })
  })

  describe('updateMajorColor', () => {
    it('should update major color only', async () => {
      const colorUpdate = {
        colorHex: '#F59E0B',
      }
      const mockResponse = {
        data: {
          id: 1,
          name: 'Computer Science',
          description: 'CS program',
          majorCode: 'CS',
          active: true,
          colorHex: '#F59E0B',
          policies: [],
        },
      }
      ;(axiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMajorColor(1, colorUpdate)

      expect(axiosInstance.patch).toHaveBeenCalledWith('api/university/majors/1/color', colorUpdate)
      expect(result.colorHex).toBe('#F59E0B')
    })

    it('should handle invalid color format', async () => {
      const invalidColor = {
        colorHex: 'not-a-color',
      }
      ;(axiosInstance.patch as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid color hex format' },
        },
      })

      await expect(updateMajorColor(1, invalidColor)).rejects.toBeTruthy()
    })
  })

  describe('deleteMajorById', () => {
    it('should delete major successfully', async () => {
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ status: 204 })

      await deleteMajorById(3)

      expect(axiosInstance.delete).toHaveBeenCalledWith('api/university/majors/3')
    })

    it('should handle major not found on delete', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Major not found' },
        },
      })

      await expect(deleteMajorById(999)).rejects.toBeTruthy()
    })

    it('should handle major in use', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Major is being used by students' },
        },
      })

      await expect(deleteMajorById(1)).rejects.toBeTruthy()
    })
  })
})
