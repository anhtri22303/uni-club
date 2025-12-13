import axiosInstance from '@/lib/axiosInstance'
import { getTags, addTag, updateTag, deleteTag } from '@/service/tagApi'

jest.mock('@/lib/axiosInstance')

describe('TagApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTags', () => {
    it('should fetch all tags', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Tags fetched',
          data: [
            { tagId: 1, name: 'Technology', description: 'Tech related', core: true },
            { tagId: 2, name: 'Art', description: 'Art related', core: true },
            { tagId: 3, name: 'Sports', description: 'Sports activities', core: false },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getTags()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/tags')
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Technology')
      expect(result[0].core).toBe(true)
    })

    it('should handle empty tags', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'No tags',
          data: [],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getTags()

      expect(result).toEqual([])
    })

    it('should fetch both core and non-core tags', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Tags fetched',
          data: [
            { tagId: 1, name: 'Core Tag', description: 'Core', core: true },
            { tagId: 2, name: 'Custom Tag', description: 'Custom', core: false },
          ],
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getTags()

      expect(result.filter((tag) => tag.core)).toHaveLength(1)
      expect(result.filter((tag) => !tag.core)).toHaveLength(1)
    })
  })

  describe('addTag', () => {
    it('should create a new tag', async () => {
      const newTag = {
        name: 'Music',
        description: 'Music and performance',
        core: false,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Tag created',
          data: {
            tagId: 4,
            ...newTag,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await addTag(newTag)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/tags', newTag)
      expect(result.tagId).toBe(4)
      expect(result.name).toBe('Music')
      expect(result.core).toBe(false)
    })

    it('should create a core tag', async () => {
      const coreTag = {
        name: 'Science',
        description: 'Science related',
        core: true,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Core tag created',
          data: {
            tagId: 5,
            ...coreTag,
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await addTag(coreTag)

      expect(result.core).toBe(true)
    })

    it('should handle duplicate tag name', async () => {
      const duplicateTag = {
        name: 'Technology',
        description: 'Duplicate',
        core: false,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Tag name already exists' },
        },
      })

      await expect(addTag(duplicateTag)).rejects.toBeTruthy()
    })

    it('should handle unauthorized access', async () => {
      const newTag = {
        name: 'Unauthorized',
        description: 'Test',
        core: false,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Only ADMIN or UNIVERSITY_STAFF can create tags' },
        },
      })

      await expect(addTag(newTag)).rejects.toBeTruthy()
    })
  })

  describe('updateTag', () => {
    it('should update tag by id', async () => {
      const updateData = {
        name: 'Updated Technology',
        description: 'Updated description',
        core: false,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Tag updated',
          data: {
            tagId: 1,
            ...updateData,
          },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateTag(1, updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/tags/1', updateData)
      expect(result.name).toBe('Updated Technology')
    })

    it('should update tag by string id', async () => {
      const updateData = {
        name: 'String ID Update',
        description: 'Test',
        core: false,
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Tag updated',
          data: {
            tagId: 3,
            ...updateData,
          },
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateTag('3', updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/tags/3', updateData)
      expect(result.tagId).toBe(3)
    })

    it('should handle tag not found', async () => {
      const updateData = {
        name: 'Not Found',
        description: 'Test',
        core: false,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Tag not found' },
        },
      })

      await expect(updateTag(999, updateData)).rejects.toBeTruthy()
    })

    it('should handle core tag update restriction', async () => {
      const updateData = {
        name: 'Core Tag Update',
        description: 'Should fail',
        core: true,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Core tags cannot be modified' },
        },
      })

      await expect(updateTag(1, updateData)).rejects.toBeTruthy()
    })
  })

  describe('deleteTag', () => {
    it('should delete tag successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Tag deleted',
          data: 'Tag deleted successfully',
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteTag(3)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/tags/3')
      expect(result).toBe('Tag deleted successfully')
    })

    it('should delete tag by string id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Tag deleted',
          data: 'Deleted',
        },
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteTag('5')

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/tags/5')
      expect(result).toBe('Deleted')
    })

    it('should handle tag not found on delete', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Tag not found' },
        },
      })

      await expect(deleteTag(999)).rejects.toBeTruthy()
    })

    it('should handle core tag deletion restriction', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Core tags cannot be deleted' },
        },
      })

      await expect(deleteTag(1)).rejects.toBeTruthy()
    })

    it('should handle tag in use', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Tag is being used by events' },
        },
      })

      await expect(deleteTag(2)).rejects.toBeTruthy()
    })

    it('should handle unauthorized deletion', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Only ADMIN or UNIVERSITY_STAFF can delete tags' },
        },
      })

      await expect(deleteTag(3)).rejects.toBeTruthy()
    })
  })
})
