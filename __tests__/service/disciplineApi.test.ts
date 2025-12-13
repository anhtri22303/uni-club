import axiosInstance from '@/lib/axiosInstance'
import {
  getAllPenaltyRules,
  getPenaltyRuleById,
  createPenaltyRule,
  updatePenaltyRule,
} from '@/service/disciplineApi'

jest.mock('@/lib/axiosInstance')

describe('DisciplineApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllPenaltyRules', () => {
    it('should fetch all penalty rules', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Rules fetched',
          data: [
            {
              id: 1,
              name: 'Late Attendance',
              description: 'Arrive late to event',
              level: 'MINOR',
              penaltyPoints: 5,
            },
            {
              id: 2,
              name: 'Absent Without Notice',
              description: 'Missing event without notification',
              level: 'MEDIUM',
              penaltyPoints: 10,
            },
            {
              id: 3,
              name: 'Misconduct',
              description: 'Serious behavior violation',
              level: 'MAJOR',
              penaltyPoints: 20,
            },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllPenaltyRules()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/penalty-rules')
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Late Attendance')
      expect(result[1].level).toBe('MEDIUM')
    })

    it('should handle empty rules', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No rules',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllPenaltyRules()

      expect(result).toEqual([])
    })

    it('should handle different penalty levels', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Rules fetched',
          data: [
            { id: 1, name: 'Minor', description: 'Test', level: 'MINOR', penaltyPoints: 5 },
            { id: 2, name: 'Medium', description: 'Test', level: 'MEDIUM', penaltyPoints: 10 },
            { id: 3, name: 'Major', description: 'Test', level: 'MAJOR', penaltyPoints: 20 },
            { id: 4, name: 'Critical', description: 'Test', level: 'CRITICAL', penaltyPoints: 50 },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllPenaltyRules()

      expect(result).toHaveLength(4)
      expect(result.map((r) => r.level)).toEqual(['MINOR', 'MEDIUM', 'MAJOR', 'CRITICAL'])
    })
  })

  describe('getPenaltyRuleById', () => {
    it('should fetch penalty rule by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Rule fetched',
          data: {
            id: 1,
            name: 'Late Attendance',
            description: 'Arrive late to event',
            level: 'MINOR',
            penaltyPoints: 5,
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getPenaltyRuleById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/penalty-rules/1')
      expect(result.id).toBe(1)
      expect(result.name).toBe('Late Attendance')
      expect(result.penaltyPoints).toBe(5)
    })

    it('should handle rule not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Rule not found' },
        },
      })

      await expect(getPenaltyRuleById(999)).rejects.toBeTruthy()
    })
  })

  describe('createPenaltyRule', () => {
    it('should create minor penalty rule', async () => {
      const ruleData = {
        name: 'Late 5 Minutes',
        description: 'Arrive 5 minutes late',
        level: 'MINOR' as const,
        penaltyPoints: 3,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Rule created',
          data: null,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      await createPenaltyRule(ruleData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/penalty-rules', ruleData)
    })

    it('should create critical penalty rule', async () => {
      const ruleData = {
        name: 'Violence',
        description: 'Physical violence',
        level: 'CRITICAL' as const,
        penaltyPoints: 100,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Rule created',
          data: null,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      await createPenaltyRule(ruleData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/penalty-rules', ruleData)
    })

    it('should handle duplicate rule name', async () => {
      const ruleData = {
        name: 'Late Attendance',
        description: 'Duplicate',
        level: 'MINOR' as const,
        penaltyPoints: 5,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Rule name already exists' },
        },
      })

      await expect(createPenaltyRule(ruleData)).rejects.toBeTruthy()
    })

    it('should handle negative penalty points', async () => {
      const ruleData = {
        name: 'Invalid Rule',
        description: 'Test',
        level: 'MINOR' as const,
        penaltyPoints: -5,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Penalty points must be positive' },
        },
      })

      await expect(createPenaltyRule(ruleData)).rejects.toBeTruthy()
    })

    it('should handle unauthorized access', async () => {
      const ruleData = {
        name: 'Unauthorized',
        description: 'Test',
        level: 'MINOR' as const,
        penaltyPoints: 5,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Only UNIVERSITY_STAFF can create rules' },
        },
      })

      await expect(createPenaltyRule(ruleData)).rejects.toBeTruthy()
    })
  })

  describe('updatePenaltyRule', () => {
    it('should update penalty rule', async () => {
      const ruleData = {
        name: 'Updated Late Attendance',
        description: 'Updated description',
        level: 'MINOR' as const,
        penaltyPoints: 7,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Rule updated',
          data: null,
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      await updatePenaltyRule(1, ruleData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/penalty-rules/1', ruleData)
    })

    it('should increase penalty severity', async () => {
      const ruleData = {
        name: 'Late Attendance',
        description: 'Now more serious',
        level: 'MEDIUM' as const,
        penaltyPoints: 15,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Rule updated',
          data: null,
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      await updatePenaltyRule(1, ruleData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/penalty-rules/1', ruleData)
    })

    it('should handle rule not found on update', async () => {
      const ruleData = {
        name: 'Not Found',
        description: 'Test',
        level: 'MINOR' as const,
        penaltyPoints: 5,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Rule not found' },
        },
      })

      await expect(updatePenaltyRule(999, ruleData)).rejects.toBeTruthy()
    })

    it('should handle invalid level', async () => {
      const ruleData = {
        name: 'Test',
        description: 'Test',
        level: 'INVALID' as any,
        penaltyPoints: 5,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid penalty level' },
        },
      })

      await expect(updatePenaltyRule(1, ruleData)).rejects.toBeTruthy()
    })
  })
})
