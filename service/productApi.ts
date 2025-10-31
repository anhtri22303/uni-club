import axiosInstance from "../lib/axiosInstance"

// export interface Product {
// 	id?: number;
// 	clubId: number;
// 	name: string;
// 	description: string;
// 	pricePoints: number;
// 	stockQuantity: number;
// }

// export async function getProduct({ page = 0, size = 70, sort = "name" } = {}): Promise<Product[]> {
// 	const res = await axiosInstance.get("/api/products", {
// 		params: { page, size, sort },
// 	});
// 	const data = res.data as { content?: Product[] };
// 	return Array.isArray(data.content) ? data.content : [];
// }

// // POST /api/products - add a new product
// export async function addProduct(productData: Product): Promise<any> {
// 	const res = await axiosInstance.post("/api/products", productData);
// 	return res.data;
// }

// --- Standard API Response Wrappers (Inferred from Swagger) ---

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Cấu trúc response phân trang (thường nằm trong trường 'data')
 */
interface PageableResponse<T> {
  content: T[];
  // ... các thuộc tính phân trang khác nếu có
}

// --- Interfaces for Product ---

/**
 * Interface cho payload khi TẠO MỚI một product
 * Dựa trên: POST /api/clubs/{clubId}/products (Request Body)
 */
export interface AddProductPayload {
  name: string;
  description: string;
  stockQuantity: number;
  price: number; // Đã đổi từ pricePoints
  productType: string; // "CLUB_ITEM", etc.
  eventId?: number;
  tagIds: number[];
}

/**
 * Interface cho đối tượng Product đầy đủ (thường là response)
 * Dựa trên: POST /api/clubs/{clubId}/products (Response Data)
 */
export interface Product {
  productId: number; // Đã đổi từ id
  clubId: number;
  name: string;
  description: string;
  stockQuantity: number;
  price: number; // Đã đổi từ pricePoints
  isActive: boolean;
  media: {
    mediaId: number;
    url: string;
    isThumbnail: boolean;
    displayOrder: number;
  }[];
  tags: string[]; // Swagger (POST response) cho thấy đây là mảng string tên tag
}

/**
 * Interface cho Product Tag
 * Dựa trên: GET /api/clubs/{clubId}/products/tags (Response Data)
 */
export interface ProductTag {
  tagId: number;
  name: string;
}

// --- API Functions ---

/**
 * Lấy danh sách product của một club (phân trang)
 * MỚI: GET /api/clubs/{clubId}/products
 */
export async function getProducts(
  clubId: number,
  { page = 0, size = 70, sort = "name" }: { page?: number, size?: number, sort?: string } = {}
): Promise<Product[]> {
  const res = await axiosInstance.get<ApiResponse<PageableResponse<Product>>>(
    `/api/clubs/${clubId}/products`,
    {
      params: { page, size, sort },
    }
  );

  // Response mới được bọc trong data: { content: [] }
  const data = res.data.data;
  return Array.isArray(data?.content) ? data.content : [];
}

/**
 * Thêm một product mới cho club
 * MỚI: POST /api/clubs/{clubId}/products
 */
export async function addProduct(
  clubId: number,
  productData: AddProductPayload
): Promise<Product> {
  const res = await axiosInstance.post<ApiResponse<Product>>(
    `/api/clubs/${clubId}/products`,
    productData
  );
  // Trả về đối tượng product từ trường 'data'
  return res.data.data;
}

/**
 * (MỚI) Lấy danh sách tag của product cho một club
 * MỚI: GET /api/clubs/{clubId}/products/tags
 */
export async function getProductTags(clubId: number): Promise<ProductTag[]> {
  const res = await axiosInstance.get<ApiResponse<ProductTag[]>>(
    `/api/clubs/${clubId}/products/tags`
  );
  // Trả về mảng các tag từ trường 'data'
  return res.data.data;
}