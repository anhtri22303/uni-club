import axiosInstance from '@/lib/axiosInstance'
import { getCardByClubId, createCard } from '@/service/cardApi'

jest.mock('@/lib/axiosInstance')

describe('CardApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCardByClubId', () => {
    it('should fetch card design by club id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Card design retrieved',
          data: {
            cardId: 1,
            clubId: 1,
            clubName: 'Tech Club',
            borderRadius: '12px',
            cardColorClass: 'bg-blue-500',
            cardOpacity: 0.9,
            colorType: 'gradient',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            logoSize: 64,
            pattern: 'dots',
            patternOpacity: 0.3,
            qrPosition: 'bottom-right',
            qrSize: 128,
            qrStyle: 'rounded',
            showLogo: true,
            logoUrl: 'https://example.com/logo.png',
            createdAt: '2025-01-15T10:00:00Z',
          },
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getCardByClubId(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/cards/club/1')
      expect(result.cardId).toBe(1)
      expect(result.clubName).toBe('Tech Club')
      expect(result.showLogo).toBe(true)
    })

    it('should handle card not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Card design not found' },
        },
      })

      await expect(getCardByClubId(999)).rejects.toBeTruthy()
    })

    it('should handle unauthorized access', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Not authorized to view this card' },
        },
      })

      await expect(getCardByClubId(1)).rejects.toBeTruthy()
    })
  })

  describe('createCard', () => {
    it('should create card design successfully', async () => {
      const cardData = {
        borderRadius: '16px',
        cardColorClass: 'bg-purple-600',
        cardOpacity: 1.0,
        colorType: 'solid',
        gradient: '',
        logoSize: 80,
        pattern: 'waves',
        patternOpacity: 0.2,
        qrPosition: 'center',
        qrSize: 150,
        qrStyle: 'square',
        showLogo: true,
        logoUrl: 'https://example.com/new-logo.png',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Card design created',
          data: {
            cardId: 2,
            clubId: 1,
            ...cardData,
            clubName: 'Tech Club',
            createdAt: '2025-01-15T11:00:00Z',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createCard(1, cardData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/cards/1', cardData)
      expect(result.cardId).toBe(2)
      expect(result.qrPosition).toBe('center')
    })

    it('should update existing card design', async () => {
      const cardData = {
        borderRadius: '8px',
        cardColorClass: 'bg-red-500',
        cardOpacity: 0.85,
        colorType: 'gradient',
        gradient: 'linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%)',
        logoSize: 60,
        pattern: 'circles',
        patternOpacity: 0.4,
        qrPosition: 'top-left',
        qrSize: 120,
        qrStyle: 'dots',
        showLogo: false,
        logoUrl: '',
      }
      const mockResponse = {
        data: {
          success: true,
          message: 'Card design updated',
          data: {
            cardId: 1,
            clubId: 1,
            ...cardData,
            clubName: 'Tech Club',
            createdAt: '2025-01-15T09:00:00Z',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createCard(1, cardData)

      expect(result.cardId).toBe(1)
      expect(result.showLogo).toBe(false)
    })

    it('should handle invalid card data', async () => {
      const invalidData = {
        borderRadius: '',
        cardColorClass: '',
        cardOpacity: -1,
        colorType: 'invalid',
        gradient: '',
        logoSize: 0,
        pattern: '',
        patternOpacity: 2.0,
        qrPosition: 'invalid',
        qrSize: 0,
        qrStyle: '',
        showLogo: true,
        logoUrl: 'invalid-url',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid card design data' },
        },
      })

      await expect(createCard(1, invalidData)).rejects.toBeTruthy()
    })

    it('should handle club not found', async () => {
      const cardData = {
        borderRadius: '12px',
        cardColorClass: 'bg-blue-500',
        cardOpacity: 0.9,
        colorType: 'solid',
        gradient: '',
        logoSize: 64,
        pattern: 'dots',
        patternOpacity: 0.3,
        qrPosition: 'bottom-right',
        qrSize: 128,
        qrStyle: 'rounded',
        showLogo: true,
        logoUrl: 'https://example.com/logo.png',
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(createCard(999, cardData)).rejects.toBeTruthy()
    })

    it('should create card with gradient style', async () => {
      const gradientCard = {
        borderRadius: '20px',
        cardColorClass: '',
        cardOpacity: 0.95,
        colorType: 'gradient',
        gradient: 'linear-gradient(45deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)',
        logoSize: 72,
        pattern: 'hexagons',
        patternOpacity: 0.25,
        qrPosition: 'bottom-center',
        qrSize: 140,
        qrStyle: 'rounded',
        showLogo: true,
        logoUrl: 'https://example.com/gradient-logo.png',
      }
      const mockResponse = {
        data: {
          success: true,
          data: {
            cardId: 3,
            clubId: 1,
            ...gradientCard,
            clubName: 'Design Club',
            createdAt: '2025-01-15T12:00:00Z',
          },
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createCard(1, gradientCard)

      expect(result.colorType).toBe('gradient')
      expect(result.gradient).toContain('#12c2e9')
    })
  })
})
