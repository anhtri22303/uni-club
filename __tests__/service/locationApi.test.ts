import axiosInstance from '@/lib/axiosInstance'
import {
  fetchLocation,
  getLocationById,
  postLocation,
  deleteLocation,
  updateLocation,
} from '@/service/locationApi'

jest.mock('@/lib/axiosInstance')

describe('LocationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchLocation', () => {
    it('should fetch locations with default params', async () => {
      const mockResponse = {
        data: {
          content: [
            { id: 1, name: 'Main Hall', address: '123 University Ave', capacity: 500 },
            { id: 2, name: 'Lab A', address: '456 Campus Dr', capacity: 50 },
          ],
          pageable: {
            pageNumber: 0,
            pageSize: 20,
            sort: { sorted: false, empty: true, unsorted: true },
            offset: 0,
            paged: true,
            unpaged: false,
          },
          totalElements: 2,
          totalPages: 1,
          last: true,
          first: true,
          size: 20,
          number: 0,
          numberOfElements: 2,
          empty: false,
          sort: { sorted: false, empty: true, unsorted: true },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchLocation()

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result.content).toHaveLength(2)
      expect(result.totalElements).toBe(2)
    })

    it('should fetch locations with custom params', async () => {
      const mockResponse = {
        data: {
          content: [{ id: 1, name: 'Main Hall', address: '123 University Ave', capacity: 500 }],
          pageable: { pageNumber: 1, pageSize: 10 },
          totalElements: 15,
          totalPages: 2,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchLocation({ page: 1, size: 10, sort: ['name,asc'] })

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/locations', {
        params: { page: 1, size: 10, sort: ['name,asc'] },
      })
      expect(result.content).toHaveLength(1)
    })

    it('should handle empty locations', async () => {
      const mockResponse = {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          empty: true,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchLocation()

      expect(result.content).toEqual([])
      expect(result.empty).toBe(true)
    })
  })

  describe('getLocationById', () => {
    it('should fetch location by id', async () => {
      const mockLocation = {
        id: 1,
        name: 'Main Hall',
        address: '123 University Ave',
        capacity: 500,
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockLocation })

      const result = await getLocationById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/locations/1')
      expect(result).toEqual(mockLocation)
    })

    it('should fetch location by string id', async () => {
      const mockLocation = {
        id: 2,
        name: 'Lab B',
        address: '789 Campus Rd',
        capacity: 30,
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockLocation })

      const result = await getLocationById('2')

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/locations/2')
      expect(result.name).toBe('Lab B')
    })

    it('should handle location not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Location not found' },
        },
      })

      await expect(getLocationById(999)).rejects.toBeTruthy()
    })
  })

  describe('postLocation', () => {
    it('should create location successfully', async () => {
      const newLocation = {
        name: 'New Auditorium',
        address: '999 Campus Blvd',
        capacity: 300,
      }
      const mockResponse = {
        id: 3,
        ...newLocation,
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await postLocation(newLocation)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/locations', newLocation)
      expect(result.id).toBe(3)
      expect(result.name).toBe('New Auditorium')
    })

    it('should handle duplicate location name', async () => {
      const newLocation = {
        name: 'Main Hall',
        address: '123 University Ave',
        capacity: 500,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Location name already exists' },
        },
      })

      await expect(postLocation(newLocation)).rejects.toBeTruthy()
    })

    it('should handle invalid capacity', async () => {
      const newLocation = {
        name: 'Invalid Room',
        address: '000 Test St',
        capacity: -10,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Capacity must be positive' },
        },
      })

      await expect(postLocation(newLocation)).rejects.toBeTruthy()
    })
  })

  describe('updateLocation', () => {
    it('should update location successfully', async () => {
      const updateData = {
        name: 'Updated Hall',
        address: '123 New Address',
        capacity: 600,
      }
      const mockResponse = {
        success: true,
        message: 'Location updated',
        data: {
          id: 1,
          ...updateData,
        },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateLocation(1, updateData)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/locations/1', updateData)
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Hall')
    })

    it('should handle location not found on update', async () => {
      const updateData = {
        name: 'Updated Hall',
        address: '123 New Address',
        capacity: 600,
      }
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Location not found' },
        },
      })

      await expect(updateLocation(999, updateData)).rejects.toBeTruthy()
    })
  })

  describe('deleteLocation', () => {
    it('should delete location successfully', async () => {
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ status: 204 })

      await deleteLocation(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/locations/1')
    })

    it('should handle location not found on delete', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Location not found' },
        },
      })

      await expect(deleteLocation(999)).rejects.toBeTruthy()
    })

    it('should handle location in use', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Location is being used by events' },
        },
      })

      await expect(deleteLocation(1)).rejects.toBeTruthy()
    })
  })
})
