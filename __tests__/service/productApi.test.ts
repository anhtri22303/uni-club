import axiosInstance from '@/lib/axiosInstance'
import {
  getProducts,
  getEventProductsOnTime,
  getAllProductsPaginated,
  addProduct,
  getProductById,
  updateProduct,
  patchProduct,
  deleteProduct,
  updateStock,
  getStockHistory,
  getMediaForProduct,
  addMediaToProduct,
  deleteMediaFromProduct,
} from '@/service/productApi'

jest.mock('@/lib/axiosInstance')

describe('ProductApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProducts', () => {
    it('should fetch all products', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, name: 'Product 1', pointCost: 100, stockQuantity: 10 },
          { id: 2, name: 'Product 2', pointCost: 200, stockQuantity: 5 },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getProducts(1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('should handle empty products list', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getProducts(1)

      expect(result).toEqual([])
    })
  })

  describe('getEventProductsOnTime', () => {
    it('should fetch event products on time', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, name: 'Event Product', eventId: 1 },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getEventProductsOnTime(1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(1)
    })

    it('should handle event not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      })

      await expect(getEventProductsOnTime(999)).rejects.toBeTruthy()
    })
  })

  describe('getAllProductsPaginated', () => {
    it('should fetch paginated products', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [
            { id: 1, name: 'Product 1' },
            { id: 2, name: 'Product 2' },
          ],
          totalElements: 10,
          totalPages: 2,
          pageNo: 0,
          pageSize: 5,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getAllProductsPaginated(1, { page: 0, size: 5 })

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result.content).toHaveLength(2)
      expect(result.totalElements).toBe(10)
    })

    it('should handle empty page', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getAllProductsPaginated(1, { page: 0, size: 10 })

      expect(result.content).toEqual([])
    })
  })

  describe('addProduct', () => {
    it('should add product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'Description',
        pointCost: 150,
        stockQuantity: 20,
        type: 'CLUB',
        eventId: 0,
        tagIds: [],
      }
      const mockResponse = {
        success: true,
        message: 'Product created',
        data: { id: 3, ...productData },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await addProduct(1, productData)

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result).toHaveProperty('id')
    })

    it('should handle validation errors', async () => {
      const invalidData: any = {
        name: '',
        pointCost: -1,
      }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid product data' },
        },
      })

      await expect(addProduct(1, invalidData)).rejects.toBeTruthy()
    })

    it('should handle duplicate product name', async () => {
      const productData: any = { name: 'Existing Product' }
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Product name already exists' },
        },
      })

      await expect(addProduct(1, productData)).rejects.toBeTruthy()
    })
  })

  describe('getProductById', () => {
    it('should fetch product by id', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Product 1',
          pointCost: 100,
          stockQuantity: 10,
        },
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getProductById(1, 1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result.id).toBe(1)
    })

    it('should handle product not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Product not found' },
        },
      })

      await expect(getProductById(1, 999)).rejects.toBeTruthy()
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        description: 'New desc',
        pointCost: 200,
        stockQuantity: 10,
        type: 'CLUB',
        eventId: 0,
        status: 'ACTIVE',
        tagIds: [],
      }
      const mockResponse = {
        success: true,
        message: 'Product updated',
        data: { id: 1, ...updateData },
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateProduct(1, 1, updateData)

      expect(axiosInstance.put).toHaveBeenCalled()
      expect(result).toHaveProperty('id')
    })

    it('should handle unauthorized update', async () => {
      const updateData: any = {}
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Unauthorized' },
        },
      })

      await expect(updateProduct(1, 1, updateData)).rejects.toBeTruthy()
    })
  })

  describe('patchProduct', () => {
    it('should patch product partially', async () => {
      const patchData = { stockQuantity: 5 }
      const mockResponse = {
        success: true,
        data: { id: 1, stockQuantity: 5 },
      }
      ;(axiosInstance.patch as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await patchProduct(1, 1, patchData)

      expect(axiosInstance.patch).toHaveBeenCalled()
      expect(result.id).toBe(1)
    })
  })

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const mockResponse = {
        success: true,
        data: 'Product deleted',
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await deleteProduct(1, 1)

      expect(axiosInstance.delete).toHaveBeenCalled()
      expect(result).toBe('Product deleted')
    })

    it('should handle product in use', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Product has pending orders' },
        },
      })

      await expect(deleteProduct(1, 1)).rejects.toBeTruthy()
    })
  })

  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, stockQuantity: 50 },
      }
      ;(axiosInstance.patch as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateStock(1, 1, 50, 'Restock')

      expect(axiosInstance.patch).toHaveBeenCalled()
      expect(result.id).toBe(1)
    })

    it('should handle negative stock', async () => {
      ;(axiosInstance.patch as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Stock cannot be negative' },
        },
      })

      await expect(updateStock(1, 1, -5, 'Invalid')).rejects.toBeTruthy()
    })
  })

  describe('getStockHistory', () => {
    it('should fetch stock history', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, oldStock: 10, newStock: 20, note: 'Restock', changedAt: '2025-01-01' },
          { id: 2, oldStock: 20, newStock: 18, note: 'Sale', changedAt: '2025-01-02' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getStockHistory(1, 1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })
  })

  describe('getMediaForProduct', () => {
    it('should fetch product media', async () => {
      const mockResponse = {
        success: true,
        data: [
          { mediaId: 1, url: 'image1.jpg', type: 'IMAGE' },
          { mediaId: 2, url: 'image2.jpg', type: 'IMAGE' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMediaForProduct(1, 1)

      expect(axiosInstance.get).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })
  })

  describe('addMediaToProduct', () => {
    it('should add media successfully', async () => {
      const mockFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' })
      const mockResponse = {
        success: true,
        data: { mediaId: 1, url: 'image.jpg' },
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await addMediaToProduct(1, 1, mockFile)

      expect(axiosInstance.post).toHaveBeenCalled()
      expect(result.mediaId).toBe(1)
    })

    it('should handle invalid file type', async () => {
      const mockFile = new File(['content'], 'file.txt', { type: 'text/plain' })
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid file type' },
        },
      })

      await expect(addMediaToProduct(1, 1, mockFile)).rejects.toBeTruthy()
    })
  })

  describe('deleteMediaFromProduct', () => {
    it('should delete media successfully', async () => {
      const mockResponse = {
        success: true,
        data: 'Media deleted',
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await deleteMediaFromProduct(1, 1, 1)

      expect(axiosInstance.delete).toHaveBeenCalled()
      expect(result).toBe('Media deleted')
    })

    it('should handle media not found', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Media not found' },
        },
      })

      await expect(deleteMediaFromProduct(1, 1, 999)).rejects.toBeTruthy()
    })
  })
})
