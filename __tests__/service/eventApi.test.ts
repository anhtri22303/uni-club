import axiosInstance from '@/lib/axiosInstance'
import {
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  checkInToEvent,
  timeStringToObject,
  timeObjectToString,
  isMultiDayEvent,
  type Event,
  type CreateEventPayload,
} from '@/service/eventApi'

// Mock axios instance
jest.mock('@/lib/axiosInstance')

describe('EventApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Helper Functions', () => {
    describe('timeStringToObject', () => {
      it('should convert time string to TimeObject', () => {
        const result = timeStringToObject('14:30:00')
        expect(result).toEqual({
          hour: 14,
          minute: 30,
          second: 0,
          nano: 0,
        })
      })

      it('should handle time string without seconds', () => {
        const result = timeStringToObject('09:15')
        expect(result).toEqual({
          hour: 9,
          minute: 15,
          second: 0,
          nano: 0,
        })
      })
    })

    describe('timeObjectToString', () => {
      it('should convert TimeObject to string', () => {
        const result = timeObjectToString({
          hour: 14,
          minute: 30,
          second: 45,
          nano: 0,
        })
        expect(result).toBe('14:30:45')
      })

      it('should handle null input', () => {
        const result = timeObjectToString(null)
        expect(result).toBe('00:00:00')
      })

      it('should handle string input', () => {
        const result = timeObjectToString('10:20:30')
        expect(result).toBe('10:20:30')
      })

      it('should pad single digit numbers', () => {
        const result = timeObjectToString({
          hour: 9,
          minute: 5,
          second: 3,
          nano: 0,
        })
        expect(result).toBe('09:05:03')
      })
    })

    describe('isMultiDayEvent', () => {
      it('should return true for multi-day events', () => {
        const event: Event = {
          id: 1,
          name: 'Multi-day Event',
          description: 'Test',
          type: 'PUBLIC',
          status: 'APPROVED',
          checkInCode: 'CODE123',
          locationName: 'Location',
          maxCheckInCount: 100,
          currentCheckInCount: 0,
          budgetPoints: 1000,
          commitPointCost: 10,
          hostClub: { id: 1, name: 'Club' },
          days: [
            { id: 1, date: '2024-01-01', startTime: '09:00', endTime: '17:00' },
            { id: 2, date: '2024-01-02', startTime: '09:00', endTime: '17:00' },
          ],
        }
        expect(isMultiDayEvent(event)).toBe(true)
      })

      it('should return false for single-day events', () => {
        const event: Event = {
          id: 1,
          name: 'Single-day Event',
          description: 'Test',
          type: 'PUBLIC',
          status: 'APPROVED',
          checkInCode: 'CODE123',
          locationName: 'Location',
          maxCheckInCount: 100,
          currentCheckInCount: 0,
          budgetPoints: 1000,
          commitPointCost: 10,
          hostClub: { id: 1, name: 'Club' },
          date: '2024-01-01',
        }
        expect(isMultiDayEvent(event)).toBe(false)
      })
    })
  })

  describe('fetchEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Event 1',
          status: 'APPROVED',
        },
        {
          id: 2,
          name: 'Event 2',
          status: 'PENDING',
        },
      ]
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockEvents })

      const result = await fetchEvents()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events')
      expect(result).toEqual(mockEvents)
    })

    it('should handle errors when fetching events', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(fetchEvents()).rejects.toThrow('Network error')
    })
  })

  describe('fetchEventById', () => {
    it('should fetch event by id successfully', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        description: 'Description',
        status: 'APPROVED',
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockEvent })

      const result = await fetchEventById(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/events/1')
      expect(result).toEqual(mockEvent)
    })

    it('should handle 404 error', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(fetchEventById(999)).rejects.toBeTruthy()
    })
  })

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const mockPayload: CreateEventPayload = {
        hostClubId: 1,
        name: 'New Event',
        description: 'Event Description',
        type: 'PUBLIC',
        days: [
          {
            date: '2024-01-15',
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
        registrationDeadline: '2024-01-10',
        locationId: 1,
        maxCheckInCount: 100,
        commitPointCost: 10,
      }

      const mockResponse = {
        id: 1,
        ...mockPayload,
        status: 'PENDING',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await createEvent(mockPayload)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/events', mockPayload)
      expect(result).toEqual(mockResponse)
    })

    it('should handle validation errors', async () => {
      const invalidPayload = {} as CreateEventPayload
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 400, data: { message: 'Validation error' } },
      })

      await expect(createEvent(invalidPayload)).rejects.toBeTruthy()
    })
  })

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const mockUpdate = {
        name: 'Updated Event',
        description: 'Updated Description',
      }
      const mockResponse = { id: 1, ...mockUpdate }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateEvent(1, mockUpdate)

      expect(axiosInstance.put).toHaveBeenCalledWith('/api/events/1', mockUpdate)
      expect(result).toEqual(mockResponse)
    })

    it('should handle unauthorized update', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: { status: 403 },
      })

      await expect(updateEvent(1, {})).rejects.toBeTruthy()
    })
  })

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

      await deleteEvent(1)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/events/1')
    })

    it('should handle delete failure', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(deleteEvent(999)).rejects.toBeTruthy()
    })
  })

  describe('registerForEvent', () => {
    it('should register for event successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Registered successfully',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await registerForEvent(1)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/events/1/register')
      expect(result).toEqual(mockResponse)
    })

    it('should handle registration when event is full', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 400, data: { message: 'Event is full' } },
      })

      await expect(registerForEvent(1)).rejects.toBeTruthy()
    })
  })

  describe('checkInToEvent', () => {
    it('should check in to event successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Checked in successfully',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await checkInToEvent(1, 'CHECK123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/events/1/checkin', {
        checkInCode: 'CHECK123',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid check-in code', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid check-in code' } },
      })

      await expect(checkInToEvent(1, 'INVALID')).rejects.toBeTruthy()
    })

    it('should handle already checked in', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 409, data: { message: 'Already checked in' } },
      })

      await expect(checkInToEvent(1, 'CHECK123')).rejects.toBeTruthy()
    })
  })
})
