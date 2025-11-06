import axiosInstance from "../lib/axiosInstance";

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
/**
 *  Cấu trúc response phân trang (cho API _all)
 */
export interface PageableResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
// --- Interfaces for Product ---

/**
 * Interface cho đối tượng Media của Product
 */
export interface ProductMedia {
  mediaId: number;
  url: string;
  type: string;
  displayOrder: number;
  thumbnail: boolean;
}

/**
 * Interface cho đối tượng Product đầy đủ (từ GET /products/{id})
 */
export interface Product {
  id: number;
  productCode: string;
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  type: string;
  status: string;
  clubId: number;
  clubName: string;
  eventId: number;
  createdAt: string;
  redeemCount: number;
  media: ProductMedia[];
  tags: string[];
}

/**
 * Interface cho Lịch sử Tồn kho (từ GET .../stock-history)
 */
export interface StockHistory {
  id: number;
  oldStock: number;
  newStock: number;
  note: string;
  changedAt: string;
  changedBy: number;
}

/**
 * Interface cho payload filter của API _all
 */
export interface ProductFilterPayload {
  page?: number;
  size?: number;
  sort?: string; 
  status?: string;
  type?: string;
  tag?: string;
  keyword?: string;
}

/**
 * Interface cho payload khi TẠO MỚI một product (POST /products)
 */
export interface AddProductPayload {
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  type: string;
  eventId: number;
  tagIds: number[];
}

/**
 * Interface cho payload khi CẬP NHẬT một product (PUT /products/{id})
 */
export interface UpdateProductPayload {
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  type: string;
  eventId: number;
  status: string;
  tagIds: number[];
}

/**
 *  Interface cho payload khi CẬP NHẬT metadata media
 * (PUT /.../media/{mediaId}) - Gửi qua Query Params
 */
export interface UpdateMediaMetadataPayload {
  newFile: string;
  isThumbnail: boolean;
  displayOrder: number;
  type: string;
}

/**
 *  Interface cho payload khi SẮP XẾP LẠI media
 * (PUT /.../media/reorder) - Gửi qua Body
 */
export interface ReorderMediaPayload {
  orderedMediaIds: number[];
}


// --- API Functions (Grouped) ---

// === Product CRUD ===

/**
 * Lấy danh sách product của một club (GET /api/clubs/{clubId}/products)
 * (Khớp Swagger image_28c4c3.png)
 */
export async function getProducts(
  clubId: number,
  {
    includeInactive = false,
    includeArchived = false,
  }: { includeInactive?: boolean; includeArchived?: boolean } = {}
): Promise<Product[]> {
  const res = await axiosInstance.get<ApiResponse<Product[]>>(
    `/api/clubs/${clubId}/products`,
    {
      params: { includeInactive, includeArchived },
    }
  );
  const data = res.data.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Lấy danh sách sản phẩm (có phân trang) của club với bộ lọc
 * (GET /api/clubs/{clubId}/products/_all)
 */
export async function getAllProductsPaginated(
  clubId: number | string,
  filters: ProductFilterPayload
): Promise<PageableResponse<Product>> {
  const res = await axiosInstance.get<ApiResponse<PageableResponse<Product>>>(
    `/api/clubs/${clubId}/products/_all`,
    { params: filters }
  );
  return res.data.data;
}

/**
 * Tìm kiếm sản phẩm theo tags
 * (GET /api/clubs/{clubId}/products/search)
 */
export async function searchProductsByTags(
  clubId: number | string,
  tags: string[]
): Promise<Product[]> {
  const res = await axiosInstance.get<ApiResponse<Product[]>>(
    `/api/clubs/${clubId}/products/search`,
    {
      params: { tags }
    }
  );
  const data = res.data.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Thêm một product mới cho club (POST /api/clubs/{clubId}/products)
 * (Khớp Swagger image_28c4c9.png)
 */
export async function addProduct(
  clubId: number,
  productData: AddProductPayload
): Promise<Product> {
  const res = await axiosInstance.post<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products`,
    productData
  );
  return res.data.data;
}

/**
 * Lấy thông tin chi tiết của một sản phẩm (GET /api/clubs/{clubId}/products/{id})
 * (Khớp Swagger image_28bdbe.png)
 */
export async function getProductById(
  clubId: number | string,
  productId: number | string
): Promise<Product> {
  const res = await axiosInstance.get<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}`
  );
  return res.data.data;
}

/**
 * Cập nhật (Toàn bộ) thông tin sản phẩm (PUT /api/clubs/{clubId}/products/{id})
 * (Khớp Swagger image_28bdde.png)
 */
export async function updateProduct(
  clubId: number,
  productId: number | string,
  productData: UpdateProductPayload
): Promise<Product> {
  const res = await axiosInstance.put<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}`,
    productData
  );
  return res.data.data;
}

/**
 * Cập nhật (Một phần) thông tin sản phẩm (PATCH /api/clubs/{clubId}/products/{productId})
 */
export async function patchProduct(
  clubId: number | string,
  productId: number | string,
  productData: Partial<UpdateProductPayload>
): Promise<Product> {
  const res = await axiosInstance.patch<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}`,
    productData
  );
  return res.data.data;
}

/**
 * Xóa (Soft Delete) một sản phẩm (DELETE /api/clubs/{clubId}/products/{id})
 * (Khớp Swagger image_28bdfd.png)
 */
export async function deleteProduct(
  clubId: number | string,
  productId: number | string
): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/clubs/${clubId}/products/${productId}`
  );
  return res.data.data;
}

// === Stock Management ===

/**
 * Cập nhật tồn kho (PATCH /api/clubs/{clubId}/products/{id}/stock)
 */
export async function updateStock(
  clubId: number | string,
  productId: number | string,
  delta: number,
  note: string = ""
): Promise<Product> {
  const res = await axiosInstance.patch<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}/stock`,
    null,
    {
      params: { delta, note },
    }
  );
  return res.data.data;
}

/**
 * Lấy lịch sử tồn kho (GET /api/clubs/{clubId}/products/{id}/stock-history)
 */
export async function getStockHistory(
  clubId: number | string,
  productId: number | string
): Promise<StockHistory[]> {
  const res = await axiosInstance.get<ApiResponse<StockHistory[]>>(
    `/api/clubs/${clubId}/products/${productId}/stock-history`
  );
  const data = res.data.data;
  return Array.isArray(data) ? data : [];
}

// === Media Management ===

/**
 * Lấy danh sách media của sản phẩm (GET /api/clubs/{clubId}/products/{productId}/media)
 * (Khớp Swagger image_28c4e9.png)
 */
export async function getMediaForProduct(
  clubId: number | string,
  productId: number | string
): Promise<ProductMedia[]> {
  const res = await axiosInstance.get<ApiResponse<ProductMedia[]>>(
    `/api/clubs/${clubId}/products/${productId}/media`
  );
  const data = res.data.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Thêm 1 media (Upload file) (POST /api/clubs/{clubId}/products/{productId}/media)
 * (Khớp Swagger image_28c546.png)
 */
export async function addMediaToProduct(
  clubId: number | string,
  productId: number | string,
  file: File
): Promise<ProductMedia> {
  
  const formData = new FormData();
  formData.append("file", file); // Tên key là "file"

  const res = await axiosInstance.post<ApiResponse<ProductMedia>>(
    `/api/clubs/${clubId}/products/${productId}/media`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data.data;
}

/**
 * Thêm nhiều media (Upload bulk)
 * (POST /api/clubs/{clubId}/products/{productId}/media/bulk)
 * (Khớp Swagger image_28c566.png)
 */
export async function addBulkMediaToProduct(
  clubId: number | string,
  productId: number | string,
  files: File[] 
): Promise<ProductMedia[]> { 
  
  const formData = new FormData();
  // Lặp qua mảng files và append từng file
  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await axiosInstance.post<ApiResponse<ProductMedia[]>>(
    `/api/clubs/{clubId}/products/${productId}/media/bulk`,
    formData, 
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data.data;
}

/**
 * Xóa một media khỏi sản phẩm (DELETE .../media/{mediaId})
 * (Khớp Swagger image_28ba3a.png)
 */
export async function deleteMediaFromProduct(
  clubId: number,
  productId: number | string,
  mediaId: number | string
): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/clubs/${clubId}/products/${productId}/media/${mediaId}`
  );
  return res.data.data;
}

/**
 * Đặt một ảnh làm thumbnail chính
 * (PUT /.../media/{mediaId}/thumbnail)
 * (Khớp Swagger image_28bd26.png)
 */
export async function setMediaThumbnail(
  clubId: number | string,
  productId: number | string,
  mediaId: number | string
): Promise<string> { 
  const res = await axiosInstance.put<ApiResponse<string>>(
    `/api/clubs/${clubId}/products/${productId}/media/${mediaId}/thumbnail`
  );
  return res.data.data;
}

/**
 * Cập nhật metadata của một media (hoặc thay thế file)
 * (PUT /.../media/{mediaId})
 */
export async function updateMediaMetadata(
  clubId: number | string,
  productId: number | string,
  mediaId: number | string,
  payload: UpdateMediaMetadataPayload
): Promise<ProductMedia> { 
  const res = await axiosInstance.put<ApiResponse<ProductMedia>>(
    `/api/clubs/${clubId}/products/${productId}/media/${mediaId}`,
    null, 
    {
      params: payload 
    }
  );
  return res.data.data;
}

/**
 * Sắp xếp lại thứ tự hiển thị của media
 * (PUT /.../media/reorder)
 * (Khớp Swagger image_28bd44.png)
 */
export async function reorderMedia(
  clubId: number | string,
  productId: number | string,
  payload: ReorderMediaPayload
): Promise<ProductMedia[]> { 
  const res = await axiosInstance.put<ApiResponse<ProductMedia[]>>(
    `/api/clubs/${clubId}/products/${productId}/media/reorder`,
    payload
  );
  return res.data.data;
}