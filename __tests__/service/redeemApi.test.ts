import axiosInstance from '@/lib/axiosInstance'
import {
  redeemClubProduct,
  redeemEventProduct,
  getAdminAllRedeemOrders,
  getClubRedeemOrders,
  getEventRedeemOrders,
  getMemberRedeemOrders,
  getRedeemOrderById,
  completeRedeemOrder,
  refundRedeemOrder,
  refundPartialRedeemOrder,
} from '@/service/redeemApi'

jest.mock('@/lib/axiosInstance')

describe('RedeemApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('redeemClubProduct', () => {
    it('should redeem club product successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Product redeemed',
        data: {
          orderId: 1,
          orderCode: 'ORD001',
          productName: 'T-Shirt',
          quantity: 1,
          totalPoints: 100,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const payload = { productId: 1, quantity: 1, membershipId: 1 }
      const result = await redeemClubProduct(1, payload)

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result).toHaveProperty('orderId')
    })

    it('should handle insufficient points', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Insufficient points' },
        },
      })

      const payload = { productId: 1, quantity: 1, membershipId: 1 }
      await expect(redeemClubProduct(1, payload)).rejects.toBeTruthy()
    })

    it('should handle out of stock', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Product out of stock' },
        },
      })

      const payload = { productId: 1, quantity: 5, membershipId: 1 }
      await expect(redeemClubProduct(1, payload)).rejects.toBeTruthy()
    })
  })

  describe('redeemEventProduct', () => {
    it('should redeem event product successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          orderId: 2,
          orderCode: 'ORD002',
          productName: 'Event Ticket',
          quantity: 2,
          totalPoints: 200,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const payload = { productId: 1, quantity: 2, membershipId: 1 }
      const result = await redeemEventProduct(1, payload)

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result).toHaveProperty('orderId')
    })

    it('should handle event not started', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Event not started yet' },
        },
      })

      const payload = { productId: 1, quantity: 1, membershipId: 1 }
      await expect(redeemEventProduct(1, payload)).rejects.toBeTruthy()
    })
  })

  describe('getAdminAllRedeemOrders', () => {
    it('should fetch all redeem orders for admin', async () => {
      const mockResponse = {
        content: [
          { id: 1, productName: 'Product 1', status: 'PENDING' },
          { id: 2, productName: 'Product 2', status: 'COMPLETED' },
        ],
        totalElements: 2,
        totalPages: 1,
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getAdminAllRedeemOrders({ page: 0, size: 10 })

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result.content).toHaveLength(2)
    })

    it('should handle unauthorized access', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Admin access required' },
        },
      })

      await expect(getAdminAllRedeemOrders({ page: 0, size: 10 })).rejects.toBeTruthy()
    })
  })

  describe('getClubRedeemOrders', () => {
    it('should fetch club redeem orders', async () => {
      const mockResponse = {
        success: true,
        data: [
          { orderId: 1, clubName: 'Tech Club', status: 'PENDING' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubRedeemOrders(1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(1)
    })

    it('should handle empty orders', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubRedeemOrders(1)

      expect(result).toEqual([])
    })
  })

  describe('getEventRedeemOrders', () => {
    it('should fetch event redeem orders', async () => {
      const mockResponse = {
        success: true,
        data: [
          { orderId: 1, productName: 'Event Merch', status: 'COMPLETED' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getEventRedeemOrders(1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(1)
    })
  })

  describe('getMemberRedeemOrders', () => {
    it('should fetch member redeem orders', async () => {
      const mockResponse = {
        success: true,
        data: [
          { orderId: 1, productName: 'Item 1', status: 'PENDING' },
          { orderId: 2, productName: 'Item 2', status: 'COMPLETED' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMemberRedeemOrders()

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('should handle no orders', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMemberRedeemOrders()

      expect(result).toEqual([])
    })
  })

  describe('getRedeemOrderById', () => {
    it('should fetch order by id', async () => {
      const mockResponse = {
        success: true,
        data: {
          orderId: 1,
          orderCode: 'ORD001',
          productName: 'Product',
          status: 'PENDING',
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getRedeemOrderById(1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result.orderId).toBe(1)
    })

    it('should handle order not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Order not found' },
        },
      })

      await expect(getRedeemOrderById(999)).rejects.toBeTruthy()
    })
  })

  describe('completeRedeemOrder', () => {
    it('should complete order successfully', async () => {
      const mockResponse = {
        success: true,
        data: { orderId: 1, status: 'COMPLETED' },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await completeRedeemOrder(1)

      expect(axiosInstance.put).toHaveBeenCalled()
      expect(result.orderId).toBe(1)
    })

    it('should handle already completed order', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Order already completed' },
        },
      })

      await expect(completeRedeemOrder(1)).rejects.toBeTruthy()
    })
  })

  describe('refundRedeemOrder', () => {
    it('should refund order successfully', async () => {
      const mockResponse = {
        success: true,
        data: { orderId: 1, status: 'REFUNDED' },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const payload = { orderId: 1, quantityToRefund: 1, reason: 'Damaged' }
      const result = await refundRedeemOrder(payload)

      expect(axiosInstance.put).toHaveBeenCalled()
      expect(result.orderId).toBe(1)
    })

    it('should require refund reason', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Reason is required' },
        },
      })

      const payload = { orderId: 1, quantityToRefund: 1, reason: '' }
      await expect(refundRedeemOrder(payload)).rejects.toBeTruthy()
    })
  })

  describe('refundPartialRedeemOrder', () => {
    it('should partially refund order', async () => {
      const mockResponse = {
        success: true,
        data: { orderId: 1, status: 'PARTIALLY_REFUNDED' },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const payload = { orderId: 1, quantityToRefund: 2, reason: 'Some damaged' }
      const result = await refundPartialRedeemOrder(payload)

      expect(axiosInstance.put).toHaveBeenCalled()
      expect(result.orderId).toBe(1)
    })

    it('should handle invalid quantity', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid refund quantity' },
        },
      })

      const payload = { orderId: 1, quantityToRefund: 0, reason: 'reason' }
      await expect(refundPartialRedeemOrder(payload)).rejects.toBeTruthy()
    })

    it('should handle quantity exceeds order', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Refund quantity exceeds order quantity' },
        },
      })

      const payload = { orderId: 1, quantityToRefund: 100, reason: 'reason' }
      await expect(refundPartialRedeemOrder(payload)).rejects.toBeTruthy()
    })
  })
})
