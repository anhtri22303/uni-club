import axiosInstance from '@/lib/axiosInstance'
import {
  getWallet,
  getWalletTransactions,
  transferPoints,
  addPoints,
  reducePoints,
  rewardPointsToUser,
  rewardPointsToClub,
} from '@/service/walletApi'

// Mock axios instance
jest.mock('@/lib/axiosInstance')

describe('WalletApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWallet', () => {
    it('should fetch wallet successfully', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        balance: 1000,
        currency: 'POINTS',
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockWallet })

      const result = await getWallet(123)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/wallets/user/123')
      expect(result).toEqual(mockWallet)
      expect(result.balance).toBe(1000)
    })

    it('should handle wallet not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: { status: 404, data: { message: 'Wallet not found' } },
      })

      await expect(getWallet(999)).rejects.toBeTruthy()
    })
  })

  describe('getWalletTransactions', () => {
    it('should fetch transactions successfully', async () => {
      const mockTransactions = [
        {
          id: 1,
          amount: 100,
          type: 'CREDIT',
          description: 'Event participation',
          createdAt: '2024-01-01',
        },
        {
          id: 2,
          amount: -50,
          type: 'DEBIT',
          description: 'Product redemption',
          createdAt: '2024-01-02',
        },
      ]
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockTransactions })

      const result = await getWalletTransactions(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/wallets/1/transactions')
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('CREDIT')
    })

    it('should handle empty transactions', async () => {
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: [] })

      const result = await getWalletTransactions(1)

      expect(result).toEqual([])
    })
  })

  describe('transferPoints', () => {
    it('should transfer points successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Points transferred successfully',
        transaction: {
          id: 1,
          amount: 100,
          fromWalletId: 1,
          toWalletId: 2,
        },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await transferPoints({
        fromWalletId: 1,
        toWalletId: 2,
        amount: 100,
        description: 'Transfer test',
      })

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/wallets/transfer', {
        fromWalletId: 1,
        toWalletId: 2,
        amount: 100,
        description: 'Transfer test',
      })
      expect(result.success).toBe(true)
    })

    it('should handle insufficient balance', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Insufficient balance' },
        },
      })

      await expect(
        transferPoints({
          fromWalletId: 1,
          toWalletId: 2,
          amount: 1000000,
        })
      ).rejects.toBeTruthy()
    })

    it('should handle negative amount', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Amount must be positive' },
        },
      })

      await expect(
        transferPoints({
          fromWalletId: 1,
          toWalletId: 2,
          amount: -100,
        })
      ).rejects.toBeTruthy()
    })
  })

  describe('addPoints', () => {
    it('should add points successfully', async () => {
      const mockResponse = {
        success: true,
        newBalance: 1100,
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await addPoints(1, 100)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/wallets/1/add', {
        amount: 100,
      })
      expect(result.newBalance).toBe(1100)
    })

    it('should handle invalid wallet id', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(addPoints(999, 100)).rejects.toBeTruthy()
    })
  })

  describe('reducePoints', () => {
    it('should reduce points successfully', async () => {
      const mockResponse = {
        success: true,
        newBalance: 900,
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await reducePoints(1, 100)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/wallets/1/reduce', {
        amount: 100,
      })
      expect(result.newBalance).toBe(900)
    })

    it('should handle insufficient balance for reduction', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Insufficient balance' },
        },
      })

      await expect(reducePoints(1, 10000)).rejects.toBeTruthy()
    })
  })

  describe('rewardPointsToUser', () => {
    it('should reward points to user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Points rewarded successfully',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await rewardPointsToUser({
        userId: 123,
        points: 50,
        reason: 'Event participation',
      })

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/wallets/reward/user', {
        userId: 123,
        points: 50,
        reason: 'Event participation',
      })
      expect(result.success).toBe(true)
    })

    it('should handle user not found', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(
        rewardPointsToUser({ userId: 999, points: 50 })
      ).rejects.toBeTruthy()
    })
  })

  describe('rewardPointsToClub', () => {
    it('should reward points to club successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Points rewarded to club',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await rewardPointsToClub({
        clubId: 1,
        points: 200,
        reason: 'Event hosting',
      })

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/wallets/reward/club', {
        clubId: 1,
        points: 200,
        reason: 'Event hosting',
      })
      expect(result.success).toBe(true)
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      })

      await expect(
        rewardPointsToClub({ clubId: 999, points: 200 })
      ).rejects.toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      )

      await expect(getWallet(1)).rejects.toThrow('Network timeout')
    })

    it('should handle server error', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } },
      })

      await expect(addPoints(1, 100)).rejects.toBeTruthy()
    })
  })
})
