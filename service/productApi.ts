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
 * Cấu trúc response phân trang
 */
interface PageableResponse<T> {
  content: T[];
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
 * Interface cho đối tượng Product đầy đủ (cập nhật theo Swagger 2025-11-01)
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
  media: ProductMedia[]; // 👈 Dùng interface ProductMedia
  tags: string[];
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
  status: string; // (e.g., "ACTIVE")
  tagIds: number[];
}
/**
 * Interface cho payload khi THÊM MEDIA (POST /products/{productId}/media)
 */
export interface AddMediaPayload {
  urls: string[];
  type?: string; // Default: "IMAGE"
  thumbnail?: boolean; // Default: false
}
/**
 * Interface cho payload khi CẬP NHẬT một media (PATCH .../media/{mediaId})
 */
export interface UpdateMediaPayload {
  url?: string;
  thumbnail?: boolean;
  displayOrder?: number;
}
// --- API Functions ---

/**
 * Lấy danh sách product của một club (GET /products)
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
 * Thêm một product mới cho club (POST /products)
 */
export async function addProduct(
  clubId: number,
  productData: AddProductPayload // Dùng payload đã cập nhật
): Promise<Product> {
  const res = await axiosInstance.post<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products`,
    productData
  );
  return res.data.data;
}

/**
 * Lấy thông tin chi tiết của một sản phẩm (GET /products/{id})
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
 *  Cập nhật thông tin chi tiết của một sản phẩm (PUT /products/{id})
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
 * Thêm media (ảnh/video) cho một product (POST /products/{productId}/media)
 */
export async function addMediaToProduct(
  clubId: number,
  productId: number | string,
  { urls, type, thumbnail }: AddMediaPayload
): Promise<ProductMedia> {
  const res = await axiosInstance.post<ApiResponse<ProductMedia>>(
    `/api/clubs/${clubId}/products/${productId}/media`,
    null, // Không có body
    {
      params: { urls, type, thumbnail }, // Dữ liệu gửi qua query params
    }
  );
  console.log("addMediaToProduct response:", res.data);
  return res.data.data;
}

/**
 * 👈 MỚI: Xóa một media khỏi sản phẩm (DELETE .../media/{mediaId})
 */
export async function deleteMediaFromProduct(
  clubId: number,
  productId: number | string,
  mediaId: number | string
): Promise<string> { // Thường trả về message
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/clubs/${clubId}/products/${productId}/media/${mediaId}`
  );
  return res.data.data;
}

/**
 * 👈 MỚI: Cập nhật media (vd: set làm thumbnail) (PATCH .../media/{mediaId})
 * Ghi chú: API này không có body, nên ta giả định nó là một "hành động",
 * ví dụ như "đặt làm thumbnail".
 */
// export async function setMediaAsThumbnail(
//   clubId: number,
//   productId: number | string,
//   mediaId: number | string
// ): Promise<ProductMedia> { // Thường trả về media đã cập nhật
//   const res = await axiosInstance.patch<ApiResponse<ProductMedia>>(
//     `/api/clubs/${clubId}/products/${productId}/media/${mediaId}`,
//     null, // Không có body
//     {
//       params: {
//         thumbnail: true // 👈 THÊM DÒNG NÀY: Gửi ?thumbnail=true
//       }
//     }
//   );
//   return res.data.data;
// }
/**
 * 👈 ĐÃ SỬA: Cập nhật media (vd: set làm thumbnail) (PATCH .../media/{mediaId})
 * Thay thế cho setMediaAsThumbnail
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
      params: payload // 👈 Gửi payload (ví dụ: { thumbnail: true } hoặc { thumbnail: false })
    }
  );
  return res.data.data;
}