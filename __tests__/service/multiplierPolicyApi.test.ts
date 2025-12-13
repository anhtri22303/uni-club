import axiosInstance from '@/lib/axiosInstance'
import {
  getMutiplierPolicy,
  getMutiplierPolicyById,
  getMutiplierPolicyByType,
  createMultiplierPolicy,
  updateMultiplierPolicy,
  deleteMutiplierPolicy,
} from '@/service/multiplierPolicyApi'

jest.mock('@/lib/axiosInstance')

describe('MultiplierPolicyApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMutiplierPolicy', () => {
    it('should fetch all policies as array', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            targetType: 'CLUB' as const,
            levelEvaluation: 'HIGH',
            activityType: 'EVENT',
            ruleName: 'High Activity Bonus',
            conditionType: 'PERCENTAGE' as const,
            minThreshold: 80,
            maxThreshold: 100,
            policyDescription: 'Bonus for high activity',
            multiplier: 1.5,
            active: true,
            updatedBy: 'admin',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicy()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/multiplier-policies')
      expect(result).toHaveLength(1)
      expect(result[0].targetType).toBe('CLUB')
    })

    it('should fetch policies with data wrapper', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1,
              targetType: 'MEMBER' as const,
              levelEvaluation: 'MEDIUM',
              activityType: 'SESSION',
              ruleName: 'Medium Activity',
              conditionType: 'ABSOLUTE' as const,
              minThreshold: 5,
              maxThreshold: 10,
              multiplier: 1.2,
              active: true,
              updatedBy: 'staff',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicy()

      expect(result).toHaveLength(1)
      expect(result[0].targetType).toBe('MEMBER')
    })

    it('should handle empty policies', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicy()

      expect(result).toEqual([])
    })
  })

  describe('getMutiplierPolicyById', () => {
    it('should fetch policy by id', async () => {
      const mockResponse = {
        data: {
          id: 1,
          targetType: 'CLUB' as const,
          levelEvaluation: 'HIGH',
          activityType: 'EVENT',
          ruleName: 'High Activity Bonus',
          conditionType: 'PERCENTAGE' as const,
          minThreshold: 80,
          maxThreshold: 100,
          multiplier: 1.5,
          active: true,
          updatedBy: 'admin',
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicyById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/multiplier-policies/1')
      expect(result.id).toBe(1)
      expect(result.multiplier).toBe(1.5)
    })

    it('should handle policy not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Policy not found' },
        },
      })

      await expect(getMutiplierPolicyById(999)).rejects.toBeTruthy()
    })
  })

  describe('getMutiplierPolicyByType', () => {
    it('should fetch policies by CLUB type', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            targetType: 'CLUB' as const,
            levelEvaluation: 'HIGH',
            activityType: 'EVENT',
            ruleName: 'Club Policy',
            conditionType: 'PERCENTAGE' as const,
            minThreshold: 80,
            maxThreshold: 100,
            multiplier: 1.5,
            active: true,
            updatedBy: 'admin',
          },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicyByType('CLUB')

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/multiplier-policies/target/CLUB')
      expect(result).toHaveLength(1)
      expect(result[0].targetType).toBe('CLUB')
    })

    it('should fetch policies by MEMBER type', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 2,
              targetType: 'MEMBER' as const,
              levelEvaluation: 'LOW',
              activityType: 'SESSION',
              ruleName: 'Member Policy',
              conditionType: 'ABSOLUTE' as const,
              minThreshold: 1,
              maxThreshold: 5,
              multiplier: 0.8,
              active: true,
              updatedBy: 'staff',
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicyByType('MEMBER')

      expect(result[0].targetType).toBe('MEMBER')
    })

    it('should handle no policies for type', async () => {
      const mockResponse = {
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMutiplierPolicyByType('CLUB')

      expect(result).toEqual([])
    })
  })

  describe('createMultiplierPolicy', () => {
    it('should create new policy', async () => {
      const newPolicy = {
        targetType: 'CLUB' as const,
        levelEvaluation: 'HIGH',
        activityType: 'EVENT',
        ruleName: 'New Policy',
        conditionType: 'PERCENTAGE' as const,
        minThreshold: 70,
        maxThreshold: 90,
        multiplier: 1.3,
        active: true,
      }
      const mockResponse = {
        data: {
          id: 3,
          ...newPolicy,
          updatedBy: 'admin',
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createMultiplierPolicy(newPolicy)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/university/multiplier-policies', newPolicy)
      expect(result.id).toBe(3)
      expect(result.ruleName).toBe('New Policy')
    })

    it('should handle validation error', async () => {
      const invalidPolicy = {
        targetType: 'CLUB' as const,
        levelEvaluation: 'HIGH',
        activityType: 'EVENT',
        ruleName: '',
        conditionType: 'PERCENTAGE' as const,
        minThreshold: 100,
        maxThreshold: 50,
        multiplier: -1,
        active: true,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid policy data' },
        },
      })

      await expect(createMultiplierPolicy(invalidPolicy)).rejects.toBeTruthy()
    })
  })

  describe('updateMultiplierPolicy', () => {
    it('should update policy', async () => {
      const updateData = {
        ruleName: 'Updated Rule',
        multiplier: 1.8,
        active: true,
      }
      const mockResponse = {
        data: {
          id: 1,
          targetType: 'CLUB' as const,
          levelEvaluation: 'HIGH',
          activityType: 'EVENT',
          ruleName: 'Updated Rule',
          conditionType: 'PERCENTAGE' as const,
          minThreshold: 80,
          maxThreshold: 100,
          multiplier: 1.8,
          active: true,
          updatedBy: 'admin',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMultiplierPolicy(1, updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/university/multiplier-policies/1', updateData)
      expect(result.ruleName).toBe('Updated Rule')
      expect(result.multiplier).toBe(1.8)
    })

    it('should deactivate policy', async () => {
      const updateData = {
        active: false,
      }
      const mockResponse = {
        data: {
          id: 1,
          targetType: 'CLUB' as const,
          levelEvaluation: 'HIGH',
          activityType: 'EVENT',
          ruleName: 'Policy',
          conditionType: 'PERCENTAGE' as const,
          minThreshold: 80,
          maxThreshold: 100,
          multiplier: 1.5,
          active: false,
          updatedBy: 'admin',
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMultiplierPolicy(1, updateData)

      expect(result.active).toBe(false)
    })

    it('should handle policy not found', async () => {
      const updateData = {
        ruleName: 'Not Found',
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Policy not found' },
        },
      })

      await expect(updateMultiplierPolicy(999, updateData)).rejects.toBeTruthy()
    })
  })

  describe('deleteMutiplierPolicy', () => {
    it('should delete policy successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Policy deleted',
          data: 'Deleted successfully',
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteMutiplierPolicy(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/university/multiplier-policies/1')
      expect(result).toBe('Deleted successfully')
    })

    it('should handle policy not found on delete', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Policy not found' },
        },
      })

      await expect(deleteMutiplierPolicy(999)).rejects.toBeTruthy()
    })

    it('should handle policy in use', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Policy is being used' },
        },
      })

      await expect(deleteMutiplierPolicy(1)).rejects.toBeTruthy()
    })
  })
})
