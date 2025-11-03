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
 *  Cấu trúc response phân trang (cho API _all)
 */
export interface PageableResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  // ... các thuộc tính phân trang khác nếu có
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
 * (Dựa trên Swagger cho GET /_all)
 */
export interface ProductFilterPayload {
  page?: number;
  size?: number;
  sort?: string; // Gửi dạng string "field,asc" or "field,desc"
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
 *  AddMediaPayload (vì API đã thay đổi, không dùng URL nữa)
 */

/**
 * Interface cho payload khi CẬP NHẬT một media (PATCH .../media/{mediaId})
 */
export interface UpdateMediaPayload {
  url?: string;
  thumbnail?: boolean;
  displayOrder?: number;
}

// --- API Functions (Grouped) ---

// === Product CRUD ===

/**
 * Lấy danh sách product của một club (GET /api/clubs/{clubId}/products)
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
 * ❗️ MỚI: Lấy danh sách sản phẩm (có phân trang) của club với bộ lọc
 * (GET /api/clubs/{clubId}/products/_all)
 */
export async function getAllProductsPaginated(
  clubId: number | string,
  filters: ProductFilterPayload
): Promise<PageableResponse<Product>> {

  // Gửi filters trực tiếp_dưới dạng params
  // (Axios sẽ chuyển { page: 0, size: 10 } thành ?page=0&size=10)
  const res = await axiosInstance.get<ApiResponse<PageableResponse<Product>>>(
    `/api/clubs/${clubId}/products/_all`,
    { params: filters }
  );
  return res.data.data;
}

/**
 * ❗️ MỚI: Tìm kiếm sản phẩm theo tags
 * (GET /api/clubs/{clubId}/products/search)
 */
export async function searchProductsByTags(
  clubId: number | string,
  tags: string[]
): Promise<Product[]> {
  const res = await axiosInstance.get<ApiResponse<Product[]>>(
    `/api/clubs/${clubId}/products/search`,
    {
      params: { tags } // Gửi mảng tags. Axios sẽ_serialize thành ?tags=a&tags=b
    }
  );
  const data = res.data.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Thêm một product mới cho club (POST /api/clubs/{clubId}/products)
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
 */
export async function getProductById(
  clubId: number,
  productId: number | string
): Promise<Product> {
  const res = await axiosInstance.get<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}`
  );
  return res.data.data;
}

/**
 * Cập nhật (Toàn bộ) thông tin sản phẩm (PUT /api/clubs/{clubId}/products/{id})
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
  productData: Partial<UpdateProductPayload> // Dùng Partial để cho phép cập nhật 1 phần
): Promise<Product> {
  const res = await axiosInstance.patch<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}`,
    productData
  );
  return res.data.data;
}

/**
 * Xóa một sản phẩm (DELETE /api/clubs/{clubId}/products/{id})
 */
export async function deleteProduct(
  clubId: number | string,
  productId: number | string
): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/clubs/${clubId}/products/${productId}`
  );
  return res.data.data; // Thường trả về message
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
): Promise<Product> { // Giả định trả về Product đã cập nhật
  const res = await axiosInstance.patch<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products/${productId}/stock`,
    null, // Không có body
    {
      params: { delta, note }, // Dữ liệu gửi qua query params
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
 * Thêm media (Upload file) (POST /api/clubs/{clubId}/products/{productId}/media)
 * API này đã thay đổi từ "gửi URL" (dạng query) sang "upload file" (dạng FormData).
 */
export async function addMediaToProduct(
  clubId: number | string,
  productId: number | string,
  file: File // 👈 Nhận vào một đối tượng File
): Promise<ProductMedia> { // Giả định trả về media vừa tạo

  const formData = new FormData();
  formData.append("file", file); // Tên key là "file" theo Swagger

  const res = await axiosInstance.post<ApiResponse<ProductMedia>>(
    `/api/clubs/${clubId}/products/${productId}/media`,
    formData, // 👈 Gửi FormData
    {
      headers: {
        "Content-Type": "multipart/form-data", // 👈 Bắt buộc cho upload file
      },
    }
  );
  return res.data.data;
}

/**
 * Xóa một media khỏi sản phẩm (DELETE .../media/{mediaId})
 * (Hàm này có trong file gốc của bạn, được giữ lại)
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
 * Cập nhật media (vd: set làm thumbnail) (PATCH .../media/{mediaId})
 * (Hàm này có trong file gốc của bạn, được giữ lại)
 */
export async function updateMedia(
  clubId: number,
  productId: number | string,
  mediaId: number | string,
  payload: UpdateMediaPayload // 👈 Nhận payload động
): Promise<ProductMedia> {
  const res = await axiosInstance.patch<ApiResponse<ProductMedia>>(
    `/api/clubs/${clubId}/products/${productId}/media/${mediaId}`,
    null, // Không có body
    {
      params: payload // 👈 Gửi payload (ví dụ: { thumbnail: true })
    }
  );
  return res.data.data;
}