import axiosInstance from '@/lib/axiosInstance'
import {
  fetchPolicies,
  fetchPolicyById,
  createPolicy,
  updatePolicyById,
  deletePolicyById,
} from '@/service/policyApi'

jest.mock('@/lib/axiosInstance')

describe('PolicyApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchPolicies', () => {
    it('should fetch all policies', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            policyName: 'CS Major Policy',
            description: 'Policy for Computer Science students',
            majorId: 1,
            majorName: 'Computer Science',
            maxClubJoin: 3,
            active: true,
          },
          {
            id: 2,
            policyName: 'BA Major Policy',
            description: 'Policy for Business Administration',
            majorId: 2,
            majorName: 'Business Administration',
            maxClubJoin: 2,
            active: true,
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchPolicies()

      expect(axiosInstance.get).toHaveBeenCalledWith('api/university/major-policies')
      expect(result).toHaveLength(2)
      expect(result[0].policyName).toBe('CS Major Policy')
    })

    it('should handle empty policies', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchPolicies()

      expect(result).toEqual([])
    })

    it('should handle fetch error', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(fetchPolicies()).rejects.toThrow('Network error')
    })
  })

  describe('fetchPolicyById', () => {
    it('should fetch policy by id', async () => {
      const mockResponse = {
        data: {
          id: 1,
          policyName: 'CS Major Policy',
          description: 'Policy for CS students',
          majorId: 1,
          majorName: 'Computer Science',
          maxClubJoin: 3,
          active: true,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchPolicyById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('api/university/major-policies/1')
      expect(result.id).toBe(1)
      expect(result.policyName).toBe('CS Major Policy')
    })

    it('should handle policy not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Policy not found' },
        },
      })

      await expect(fetchPolicyById(999)).rejects.toBeTruthy()
    })
  })

  describe('createPolicy', () => {
    it('should create new policy', async () => {
      const newPolicy = {
        policyName: 'New Policy',
        description: 'New policy description',
        majorId: 3,
        maxClubJoin: 4,
        active: true,
      }
      const mockResponse = {
        data: {
          id: 3,
          ...newPolicy,
          majorName: 'Engineering',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createPolicy(newPolicy)

      expect(axiosInstance.post).toHaveBeenCalledWith('api/university/major-policies', newPolicy)
      expect(result.id).toBe(3)
      expect(result.policyName).toBe('New Policy')
    })

    it('should create policy without major', async () => {
      const newPolicy = {
        policyName: 'General Policy',
        description: 'Applies to all majors',
        maxClubJoin: 2,
        active: true,
      }
      const mockResponse = {
        data: {
          id: 4,
          ...newPolicy,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createPolicy(newPolicy)

      expect(result.majorId).toBeUndefined()
    })

    it('should handle validation error', async () => {
      const invalidPolicy = {
        policyName: '',
        description: 'Invalid',
        maxClubJoin: -1,
        active: true,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid policy data' },
        },
      })

      await expect(createPolicy(invalidPolicy)).rejects.toBeTruthy()
    })
  })

  describe('updatePolicyById', () => {
    it('should update policy', async () => {
      const updateData = {
        policyName: 'Updated Policy',
        description: 'Updated description',
        maxClubJoin: 5,
      }
      const mockResponse = {
        data: {
          id: 1,
          policyName: 'Updated Policy',
          description: 'Updated description',
          majorId: 1,
          majorName: 'Computer Science',
          maxClubJoin: 5,
          active: true,
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updatePolicyById(1, updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('api/university/major-policies/1', updateData)
      expect(result.policyName).toBe('Updated Policy')
      expect(result.maxClubJoin).toBe(5)
    })

    it('should deactivate policy', async () => {
      const updateData = {
        active: false,
      }
      const mockResponse = {
        data: {
          id: 1,
          policyName: 'CS Policy',
          description: 'Test',
          majorId: 1,
          majorName: 'CS',
          maxClubJoin: 3,
          active: false,
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updatePolicyById(1, updateData)

      expect(result.active).toBe(false)
    })

    it('should handle policy not found', async () => {
      const updateData = {
        policyName: 'Not Found',
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Policy not found' },
        },
      })

      await expect(updatePolicyById(999, updateData)).rejects.toBeTruthy()
    })
  })

  describe('deletePolicyById', () => {
    it('should delete policy successfully', async () => {
      const mockResponse = {
        data: null,
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      await deletePolicyById(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('api/university/major-policies/1')
    })

    it('should handle policy not found on delete', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Policy not found' },
        },
      })

      await expect(deletePolicyById(999)).rejects.toBeTruthy()
    })

    it('should handle policy in use', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Policy is in use' },
        },
      })

      await expect(deletePolicyById(1)).rejects.toBeTruthy()
    })
  })
})
