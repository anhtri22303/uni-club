import axiosInstance from "../lib/axiosInstance";

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Interfaces ---

/**
 * Interface cho đối tượng Order (Đơn hàng đổi quà)
 * Dùng chung cho tất cả API
 */
export interface RedeemOrder {
  orderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPoints: number;
  productType?: string;
  status: string; // (PENDING, COMPLETED, REFUNDED, PARTIALLY_REFUNDED)
  createdAt: string;
  completedAt: string; // Có thể null
  clubName: string;
  memberName: string;
  reasonRefund?: string;
  clubId?: number;
  eventId?: number;
}

/**
 * (MỚI) Interface cho item đơn hàng trong danh sách Admin
 * (Response từ GET /api/admin/products/orders)
 */
export interface AdminRedeemOrderItem {
  id: number;
  productName: string;
  buyerName: string;
  clubName: string;
  quantity: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  orderCode: string;
  qrCodeBase64: string;
}

/**
 * (MỚI) Interface cho cấu trúc phân trang chuẩn (Spring Page)
 * (Response từ GET /api/admin/products/orders)
 */
export interface PaginationResponse<T> {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  size: number;
  number: number; // Trang hiện tại (bắt đầu từ 0)
  numberOfElements: number;
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
      direction: string;
      nullHandling: string;
      ascending: boolean;
      property: string;
      ignoreCase: boolean;
    }[];
  };
  sort: {
    direction: string;
    nullHandling: string;
    ascending: boolean;
    property: string;
    ignoreCase: boolean;
  }[];
}

/**
 * (MỚI) Interface cho tham số phân trang
 */
export interface PaginationParams {
  page: number;
  size: number;
}

/**
 * Interface cho payload (dữ liệu gửi đi) khi đổi quà
 * Dùng cho cả Club Item và Event Item
 */
export interface RedeemPayload {
  productId: number;
  quantity: number;
  membershipId: number;
}

/**
 * Interface cho payload (dữ liệu gửi đi) khi HOÀN TRẢ
 * Dùng cho cả Full và Partial Refund
 */
export interface RefundPayload {
  orderId: number | string;
  quantityToRefund: number;
  reason: string;
}

// --- API Functions ---

// === POST (Tạo đơn) ===

/**
 * Đổi một sản phẩm của Club (Club Item)
 * (POST /api/redeem/club/{clubId}/order)
 */
export async function redeemClubProduct(
  clubId: number | string,
  payload: RedeemPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.post<ApiResponse<RedeemOrder>>(
    `/api/redeem/club/${clubId}/order`,
    payload
  );
  return res.data.data;
}

/**
 * Đổi một sản phẩm của Event (Event Item)
 * (POST /api/redeem/event/{eventId}/redeem)
 */
export async function redeemEventProduct(
  eventId: number | string,
  payload: RedeemPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.post<ApiResponse<RedeemOrder>>(
    `/api/redeem/event/${eventId}/redeem`,
    payload
  );
  return res.data.data;
}

// === GET (Lấy danh sách đơn) ===

/**
 * (MỚI) [ADMIN] Lấy tất cả đơn hàng đổi quà (phân trang)
 * (GET /api/admin/products/orders)
 */
export async function getAdminAllRedeemOrders(
  params: PaginationParams
): Promise<PaginationResponse<AdminRedeemOrderItem>> {

  // 1. Sửa kiểu dữ liệu mong đợi (bỏ ApiResponse)
  const res = await axiosInstance.get<
    PaginationResponse<AdminRedeemOrderItem>
  >(`/api/admin/products/orders`, {
    params: params, // Gửi page và size dưới dạng query params
  });
  // 2. Trả về res.data trực tiếp (thay vì res.data.data)
  return res.data;
}

/**
 * Lấy lịch sử các đơn hàng đổi quà của một Club
 * (GET /api/redeem/orders/club/{clubId})
 */
export async function getClubRedeemOrders(
  clubId: number | string
): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/club/${clubId}`
  );
  return res.data.data;
}

/**
 * (MỚI) Lấy lịch sử các đơn hàng đổi quà của một Event
 * (GET /api/redeem/orders/event/{eventId})
 */
export async function getEventRedeemOrders(
  eventId: number | string
): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/event/${eventId}`
  );
  return res.data.data;
}

/**
 * (MỚI) Lấy lịch sử các đơn hàng đổi quà của chính member đang đăng nhập
 * (GET /api/redeem/orders/member)
 */
export async function getMemberRedeemOrders(): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/member`
  );
  console.log("Member redeem orders:", res.data.data);
  return res.data.data;
}

// === PUT (Cập nhật trạng thái đơn) ===

/**
 * (MỚI) Hoàn thành một đơn hàng (chuyển status sang COMPLETED)
 * (PUT /api/redeem/order/{orderId}/complete)
 */
export async function completeRedeemOrder(
  orderId: number | string
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/${orderId}/complete`
  );
  return res.data.data;
}

/**
 * (CẬP NHẬT) Hoàn trả toàn bộ đơn hàng (chuyển status sang REFUNDED)
 * (PUT /api/redeem/order/{orderId}/refund)
 */
export async function refundRedeemOrder(
  payload: RefundPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/refund`,
    payload
  );
  return res.data.data;
}

/**
 * (CẬP NHẬT) Hoàn trả một phần đơn hàng
 * (PUT /api/redeem/order/{orderId}/refund-partial)
 */
export async function refundPartialRedeemOrder(
  payload: RefundPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/refund-partial`,
    payload
  );
  return res.data.data;
}

