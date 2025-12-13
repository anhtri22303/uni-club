import axiosInstance from '@/lib/axiosInstance'
import {
  createStudentManual,
  updateStudentRegistry,
  uploadStudentRegistry,
  getAllStudentRegistry,
  searchStudentRegistry,
  checkStudentCodeValidity,
  deleteStudentFromRegistry,
  deleteAllStudentRegistry,
} from '@/service/studentCodeApi'

jest.mock('@/lib/axiosInstance')

describe('StudentCodeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createStudentManual', () => {
    it('should create student manually', async () => {
      const studentData = {
        studentCode: 'STU12345',
        fullName: 'John Doe',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Student created',
          data: {
            id: 1,
            ...studentData,
            majorCode: 'CS',
            intake: 2024,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createStudentManual(studentData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/university/student-registry/manual',
        studentData
      )
      expect(result.studentCode).toBe('STU12345')
      expect(result.fullName).toBe('John Doe')
    })

    it('should handle duplicate student code', async () => {
      const studentData = {
        studentCode: 'STU12345',
        fullName: 'John Doe',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Student code already exists' },
        },
      })

      await expect(createStudentManual(studentData)).rejects.toBeTruthy()
    })
  })

  describe('updateStudentRegistry', () => {
    it('should update student info', async () => {
      const updateData = {
        id: 1,
        studentCode: 'STU12345',
        fullName: 'John Updated',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Student updated',
          data: {
            id: 1,
            studentCode: 'STU12345',
            fullName: 'John Updated',
            majorCode: 'CS',
          },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateStudentRegistry(updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/university/student-registry/1', {
        studentCode: 'STU12345',
        fullName: 'John Updated',
      })
      expect(result.fullName).toBe('John Updated')
    })

    it('should handle student not found', async () => {
      const updateData = {
        id: 999,
        studentCode: 'STU999',
        fullName: 'Not Found',
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Student not found' },
        },
      })

      await expect(updateStudentRegistry(updateData)).rejects.toBeTruthy()
    })
  })

  describe('uploadStudentRegistry', () => {
    it('should upload student registry file', async () => {
      const file = new File(['test'], 'students.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const mockResponse = {
        data: {
          success: true,
          message: 'Upload successful',
          data: {
            newRecords: [
              { id: 1, studentCode: 'STU001', fullName: 'Student 1' },
              { id: 2, studentCode: 'STU002', fullName: 'Student 2' },
            ],
            imported: 2,
            skipped: 0,
            total: 2,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await uploadStudentRegistry(file)

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.imported).toBe(2)
      expect(result.newRecords).toHaveLength(2)
    })

    it('should handle invalid file format', async () => {
      const file = new File(['test'], 'invalid.txt', { type: 'text/plain' })
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid file format' },
        },
      })

      await expect(uploadStudentRegistry(file)).rejects.toBeTruthy()
    })
  })

  describe('getAllStudentRegistry', () => {
    it('should fetch all students', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Students fetched',
          data: [
            { id: 1, studentCode: 'STU001', fullName: 'Student 1', majorCode: 'CS' },
            { id: 2, studentCode: 'STU002', fullName: 'Student 2', majorCode: 'BA' },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllStudentRegistry()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/student-registry/all')
      expect(result).toHaveLength(2)
    })

    it('should handle empty registry', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No students',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllStudentRegistry()

      expect(result).toEqual([])
    })
  })

  describe('searchStudentRegistry', () => {
    it('should search students by keyword', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Search results',
          data: [
            { id: 1, studentCode: 'STU001', fullName: 'John Doe', majorCode: 'CS' },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await searchStudentRegistry({ keyword: 'John' })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/student-registry/search', {
        params: { keyword: 'John' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe('John Doe')
    })

    it('should return empty for no matches', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No results',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await searchStudentRegistry({ keyword: 'NonExistent' })

      expect(result).toEqual([])
    })
  })

  describe('checkStudentCodeValidity', () => {
    it('should check valid student code', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Valid code',
          data: {
            id: 1,
            studentCode: 'STU001',
            fullName: 'John Doe',
            majorCode: 'CS',
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await checkStudentCodeValidity({ code: 'STU001' })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/university/student-registry/check/STU001')
      expect(result.studentCode).toBe('STU001')
    })

    it('should handle invalid student code', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Student code not found' },
        },
      })

      await expect(checkStudentCodeValidity({ code: 'INVALID' })).rejects.toBeTruthy()
    })
  })

  describe('deleteStudentFromRegistry', () => {
    it('should delete student by code', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Student deleted',
          data: null,
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      await deleteStudentFromRegistry({ code: 'STU001' })

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/university/student-registry/STU001')
    })

    it('should handle student not found on delete', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Student not found' },
        },
      })

      await expect(deleteStudentFromRegistry({ code: 'INVALID' })).rejects.toBeTruthy()
    })
  })

  describe('deleteAllStudentRegistry', () => {
    it('should delete all students (admin only)', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'All students deleted',
          data: null,
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      await deleteAllStudentRegistry()

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/university/student-registry/all')
    })

    it('should handle unauthorized access', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Admin access required' },
        },
      })

      await expect(deleteAllStudentRegistry()).rejects.toBeTruthy()
    })
  })
})
