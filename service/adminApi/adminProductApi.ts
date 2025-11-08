import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Cấu trúc dữ liệu phân trang chung
 */
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Trang hiện tại (bắt đầu từ 0)
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Thông tin chi tiết của một sản phẩm (Admin view)
 * Dựa trên response của GET /api/admin/products
 */
export interface AdminProduct {
  id: number;
  productCode: string;
  name: string;
  clubName: string;
  type: string;
  status: string; // (vd: "ACTIVE", "INACTIVE")
  stockQuantity: number;
  pointCost: number;
  redeemCount: number;
  createdAt: string; // ISO date string
}

/**
 * Thông tin một đơn hàng đổi quà (Admin view)
 * Dựa trên response của GET /api/admin/products/orders
 */
export interface AdminRedeemOrder {
  id: number;
  productName: string;
  buyerName: string;
  quantity: number;
  totalPoints: number;
  status: string; // (vd: "PENDING", "COMPLETED")
  createdAt: string; // ISO date string
  qrCodeBase64: string;
  orderCode: string;
}

/**
 * Thông tin chi tiết một đơn hàng đổi quà (Admin view - detail)
 * Dựa trên response của GET /api/admin/products/orders/{id}
 * Lưu ý: Cấu trúc này tương tự như bản list
 */
export type AdminRedeemOrderDetail = AdminRedeemOrder;

// --- Kiểu dữ liệu cho Phân trang ---

export type AdminProductPaginationResponse = Page<AdminProduct>;
export type AdminRedeemOrderPaginationResponse = Page<AdminRedeemOrder>;

// --- Kiểu dữ liệu cho Tham số API ---

export interface FetchPaginatedParams {
  page?: number;
  size?: number;
  status?: string // (vd: "ACTIVE", "INACTIVE")
  search?: string // Từ khóa tìm kiếm
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả sản phẩm (phân trang)
 * Tương ứng với: GET /api/admin/products
 * @param params Dữ liệu phân trang (page, size)
 */
export const fetchAdminProducts = async (params: FetchPaginatedParams) => {
  const response = await axiosInstance.get<AdminProductPaginationResponse>(
    `/api/admin/products`,
    { params } // Gửi page, size qua query params
  );
  return response.data;
};

/**
 * Chuyển đổi trạng thái active/inactive của sản phẩm
 * Tương ứng với: PUT /api/admin/products/{id}/toggle
 * @param id ID của sản phẩm (path variable)
 */
export const toggleProductStatus = async (id: number) => {
  const response = await axiosInstance.put(
    `/api/admin/products/${id}/toggle`
    // Không có body, không có query params
  );
  return response.data;
};

/**
 * Lấy danh sách tất cả đơn hàng đổi quà (phân trang)
 * Tương ứng với: GET /api/admin/products/orders
 * @param params Dữ liệu phân trang (page, size)
 */
export const fetchAdminRedeemOrders = async (params: FetchPaginatedParams) => {
  const response = await axiosInstance.get<AdminRedeemOrderPaginationResponse>(
    `/api/admin/products/orders`,
    { params } // Gửi page, size qua query params
  );
  return response.data;
};

/**
 * Lấy chi tiết một đơn hàng đổi quà bằng ID
 * Tương ứng với: GET /api/admin/products/orders/{id}
 * @param id ID của đơn hàng (path variable)
 */
export const fetchAdminRedeemOrderDetail = async (id: number) => {
  const response = await axiosInstance.get<AdminRedeemOrderDetail>(
    `/api/admin/products/orders/${id}`
  );
  return response.data;
};